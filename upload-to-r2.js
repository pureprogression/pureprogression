/**
 * Скрипт для загрузки видео и poster images в Cloudflare R2
 * 
 * Использует AWS SDK v3 (R2 совместим с S3 API)
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');

// Cloudflare R2 credentials
const R2_ACCOUNT_ID = '0f5899c689490647b7d986a8b58667c8';
const R2_ACCESS_KEY_ID = '179bdde07f06ef06eb783ed027d2d668';
const R2_SECRET_ACCESS_KEY = '94c12c2783a482e3a951b6d2499e58dc7c3900cc971a76240d6df8a335eddaab';
const R2_BUCKET_NAME = 'purep-videos';
const R2_PUBLIC_URL = 'https://pub-24028780ba564e299106a5335d66f54c.r2.dev';

// Инициализация S3 клиента для R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// Директории для загрузки
const videosDir = path.join(__dirname, 'public', 'videos');
const postersDir = path.join(__dirname, 'public', 'posters');

/**
 * Проверка существования файла в R2
 */
async function fileExists(key) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: key,
      MaxKeys: 1,
    });
    const response = await s3Client.send(command);
    return response.Contents && response.Contents.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Загрузка файла в R2
 */
async function uploadFile(filePath, key, contentType) {
  try {
    const exists = await fileExists(key);
    const fileContent = fs.readFileSync(filePath);
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // Кеш на 1 год
    });

    await s3Client.send(command);
    
    const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2);
    const action = exists ? '🔄 Replaced' : '✅ Uploaded';
    console.log(`${action}: ${key} (${fileSize} MB)`);
    console.log(`   URL: ${R2_PUBLIC_URL}/${key}`);
    
    return { success: true, replaced: exists };
  } catch (error) {
    console.error(`❌ Error uploading ${key}:`, error.message);
    return { success: false, replaced: false };
  }
}

/**
 * Удаление файла из R2
 */
async function deleteFile(key) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting ${key}:`, error.message);
    return false;
  }
}

/**
 * Получение списка всех файлов в R2 по префиксу
 */
async function listAllFiles(prefix) {
  const files = [];
  let continuationToken = undefined;
  
  do {
    try {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });
      const response = await s3Client.send(command);
      
      if (response.Contents) {
        files.push(...response.Contents.map(obj => obj.Key));
      }
      
      continuationToken = response.NextContinuationToken;
    } catch (error) {
      console.error(`❌ Error listing files with prefix ${prefix}:`, error.message);
      break;
    }
  } while (continuationToken);
  
  return files;
}

/**
 * Удаление старых файлов из R2, которых нет локально
 */
async function cleanupOldFiles() {
  console.log('🧹 Checking for old files to delete...\n');
  
  // Получаем списки локальных файлов
  const localVideos = new Set(
    fs.readdirSync(videosDir)
      .filter(file => file.endsWith('.mp4'))
      .map(file => `videos/${file}`)
  );
  
  const localPosters = new Set(
    fs.readdirSync(postersDir)
      .filter(file => file.endsWith('.jpg'))
      .map(file => `posters/${file}`)
  );
  
  // Получаем списки файлов в R2
  const r2Videos = await listAllFiles('videos/');
  const r2Posters = await listAllFiles('posters/');
  
  // Находим файлы для удаления
  const videosToDelete = r2Videos.filter(key => !localVideos.has(key));
  const postersToDelete = r2Posters.filter(key => !localPosters.has(key));
  
  let deletedCount = 0;
  
  if (videosToDelete.length > 0 || postersToDelete.length > 0) {
    console.log(`📋 Found ${videosToDelete.length} old videos and ${postersToDelete.length} old posters to delete\n`);
    
    // Удаляем старые видео
    for (const key of videosToDelete) {
      const fileName = key.split('/').pop();
      console.log(`🗑️  Deleting old video: ${fileName}`);
      if (await deleteFile(key)) {
        deletedCount++;
      }
    }
    
    // Удаляем старые постеры
    for (const key of postersToDelete) {
      const fileName = key.split('/').pop();
      console.log(`🗑️  Deleting old poster: ${fileName}`);
      if (await deleteFile(key)) {
        deletedCount++;
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount} old files\n`);
  } else {
    console.log('✅ No old files to delete\n');
  }
  
  return deletedCount;
}

/**
 * Основная функция загрузки
 */
async function uploadAllFiles() {
  console.log('🚀 Starting upload to Cloudflare R2...\n');
  console.log(`📦 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`🌐 Public URL: ${R2_PUBLIC_URL}\n`);

  // Сначала удаляем старые файлы
  await cleanupOldFiles();

  let totalUploaded = 0;
  let totalReplaced = 0;
  let totalFailed = 0;
  let totalSize = 0;

  // Загрузка видео
  console.log('📹 Uploading videos...\n');
  const videoFiles = fs.readdirSync(videosDir).filter(file => file.endsWith('.mp4'));
  
  for (const file of videoFiles) {
    const filePath = path.join(videosDir, file);
    const key = `videos/${file}`;
    const result = await uploadFile(filePath, key, 'video/mp4');
    
    if (result.success) {
      totalUploaded++;
      if (result.replaced) totalReplaced++;
      totalSize += fs.statSync(filePath).size;
    } else {
      totalFailed++;
    }
  }

  // Загрузка poster images
  console.log('\n🎨 Uploading poster images...\n');
  const posterFiles = fs.readdirSync(postersDir).filter(file => file.endsWith('.jpg'));
  
  for (const file of posterFiles) {
    const filePath = path.join(postersDir, file);
    const key = `posters/${file}`;
    const result = await uploadFile(filePath, key, 'image/jpeg');
    
    if (result.success) {
      totalUploaded++;
      if (result.replaced) totalReplaced++;
      totalSize += fs.statSync(filePath).size;
    } else {
      totalFailed++;
    }
  }

  // Итоги
  const newFiles = totalUploaded - totalReplaced;
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${totalUploaded} files`);
  console.log(`   📤 New files: ${newFiles}`);
  console.log(`   🔄 Replaced: ${totalReplaced}`);
  console.log(`❌ Failed: ${totalFailed} files`);
  console.log(`📦 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('='.repeat(60));
  
  console.log('\n💡 Next steps:');
  console.log('1. Update exercises.js with R2 URLs');
  console.log('2. Test video playback');
  console.log('3. Deploy to Vercel');
  console.log(`\n🔗 Your videos are now available at: ${R2_PUBLIC_URL}/videos/`);
  console.log(`🔗 Your posters are now available at: ${R2_PUBLIC_URL}/posters/`);
}

// Запуск загрузки
uploadAllFiles().catch(console.error);

