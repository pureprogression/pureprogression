/**
 * Скрипт для загрузки видео и poster images в Cloudflare R2
 * 
 * Использует AWS SDK v3 (R2 совместим с S3 API)
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
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
 * Загрузка файла в R2
 */
async function uploadFile(filePath, key, contentType) {
  try {
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
    console.log(`✅ Uploaded: ${key} (${fileSize} MB)`);
    console.log(`   URL: ${R2_PUBLIC_URL}/${key}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error uploading ${key}:`, error.message);
    return false;
  }
}

/**
 * Основная функция загрузки
 */
async function uploadAllFiles() {
  console.log('🚀 Starting upload to Cloudflare R2...\n');
  console.log(`📦 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`🌐 Public URL: ${R2_PUBLIC_URL}\n`);

  let totalUploaded = 0;
  let totalFailed = 0;
  let totalSize = 0;

  // Загрузка видео
  console.log('📹 Uploading videos...\n');
  const videoFiles = fs.readdirSync(videosDir).filter(file => file.endsWith('.mp4'));
  
  for (const file of videoFiles) {
    const filePath = path.join(videosDir, file);
    const key = `videos/${file}`;
    const success = await uploadFile(filePath, key, 'video/mp4');
    
    if (success) {
      totalUploaded++;
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
    const success = await uploadFile(filePath, key, 'image/jpeg');
    
    if (success) {
      totalUploaded++;
      totalSize += fs.statSync(filePath).size;
    } else {
      totalFailed++;
    }
  }

  // Итоги
  console.log('\n' + '='.repeat(60));
  console.log('📊 UPLOAD SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Successfully uploaded: ${totalUploaded} files`);
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

