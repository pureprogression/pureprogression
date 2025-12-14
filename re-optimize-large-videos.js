/**
 * Скрипт для дополнительной оптимизации больших видео (>5MB)
 * Использует более агрессивные настройки сжатия
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, 'public', 'videos');
const tempDir = path.join(__dirname, 'public', 'videos-temp');

// Создаем временную папку
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Находим все видео больше 5 МБ
const videoFiles = fs.readdirSync(videosDir)
  .filter(file => file.endsWith('.mp4'))
  .map(file => {
    const filePath = path.join(videosDir, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      path: filePath,
      size: stats.size,
      sizeMB: (stats.size / 1024 / 1024).toFixed(1)
    };
  })
  .filter(video => video.size > 5 * 1024 * 1024) // Больше 5 МБ
  .sort((a, b) => b.size - a.size);

console.log(`📹 Найдено ${videoFiles.length} видео больше 5 МБ\n`);

if (videoFiles.length === 0) {
  console.log('✅ Все видео уже оптимизированы!');
  process.exit(0);
}

let successCount = 0;
let failedCount = 0;
let totalOriginalSize = 0;
let totalOptimizedSize = 0;

videoFiles.forEach((video, index) => {
  console.log(`\n[${index + 1}/${videoFiles.length}] Обрабатываем: ${video.name} (${video.sizeMB} MB)`);
  
  const outputPath = path.join(tempDir, video.name);
  
  try {
    // Более агрессивная оптимизация:
    // - Разрешение до 480p (меньше чем 720p)
    // - CRF 28 (выше = больше сжатие, но ниже качество)
    // - Bitrate 800k (меньше чем 1500k)
    // - Удаление аудио (если не нужен)
    
    console.log('  🔄 Применяем агрессивную оптимизацию...');
    
    execSync(
      `ffmpeg -i "${video.path}" ` +
      `-vf "scale='min(480,iw)':'min(854,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" ` +
      `-c:v libx264 ` +
      `-preset slow ` + // slow = лучше сжатие, но дольше
      `-crf 28 ` + // Больше сжатие (было 23)
      `-b:v 800k ` + // Меньше bitrate (было 1500k)
      `-maxrate 1200k ` +
      `-bufsize 1600k ` +
      `-an ` + // Удаляем аудио (если не нужен)
      `-movflags +faststart ` +
      `"${outputPath}" -y`,
      { stdio: 'ignore' }
    );
    
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSizeMB = (optimizedStats.size / 1024 / 1024).toFixed(1);
    const reduction = ((1 - optimizedStats.size / video.size) * 100).toFixed(0);
    
    totalOriginalSize += video.size;
    totalOptimizedSize += optimizedStats.size;
    
    console.log(`  ✅ Оптимизировано: ${video.sizeMB} MB → ${optimizedSizeMB} MB (-${reduction}%)`);
    
    // Если все еще больше 5 МБ, удаляем
    if (optimizedStats.size > 5 * 1024 * 1024) {
      console.log(`  ⚠️  Все еще больше 5 МБ - удаляем из базы`);
      fs.unlinkSync(outputPath);
      // Удаляем из exercises.js (нужно будет сделать вручную)
      failedCount++;
    } else {
      // Заменяем оригинал
      fs.renameSync(outputPath, video.path);
      console.log(`  ✅ Заменено оригинальное видео`);
      successCount++;
    }
  } catch (error) {
    console.error(`  ❌ Ошибка: ${error.message}`);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    failedCount++;
  }
});

// Удаляем временную папку
if (fs.existsSync(tempDir)) {
  fs.rmdirSync(tempDir);
}

const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(1);
const totalOptimizedMB = (totalOptimizedSize / 1024 / 1024).toFixed(1);
const totalReduction = totalOriginalSize > 0 ? ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(0) : 0;

console.log('\n' + '='.repeat(60));
console.log('📊 ИТОГИ:');
console.log('='.repeat(60));
console.log(`✅ Успешно оптимизировано: ${successCount}`);
console.log(`❌ Удалено/Ошибок: ${failedCount}`);
console.log(`📦 Было: ${totalOriginalMB} MB`);
console.log(`📦 Стало: ${totalOptimizedMB} MB`);
console.log(`💾 Экономия: ${totalReduction}%`);
console.log('='.repeat(60));

if (failedCount > 0) {
  console.log('\n⚠️  Некоторые видео все еще больше 5 МБ и были удалены.');
  console.log('   Нужно будет удалить их из exercises.js вручную.');
}

