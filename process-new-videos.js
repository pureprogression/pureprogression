/**
 * Комбинированный скрипт для обработки новых видео:
 * 1. Оптимизирует видео для веба
 * 2. Генерирует poster изображения
 * 
 * Установка: убедитесь что ffmpeg установлен (brew install ffmpeg)
 * Запуск: node process-new-videos.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, 'public', 'videos');
const postersDir = path.join(__dirname, 'public', 'posters');
const optimizedDir = path.join(__dirname, 'public', 'videos-optimized');

// Создаем папки если их нет
if (!fs.existsSync(postersDir)) {
  fs.mkdirSync(postersDir, { recursive: true });
  console.log('✅ Создана папка /public/posters');
}

if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
  console.log('✅ Создана папка /public/videos-optimized');
}

// Получаем все видео файлы
const videoFiles = fs.readdirSync(videosDir).filter(file => file.endsWith('.mp4'));

console.log(`📹 Найдено ${videoFiles.length} видео файлов\n`);
console.log('🚀 Начинаем обработку...\n');

let optimizedCount = 0;
let posterCount = 0;
let skippedOptimized = 0;
let skippedPoster = 0;
let errorCount = 0;

videoFiles.forEach((videoFile, index) => {
  const inputPath = path.join(videosDir, videoFile);
  const optimizedPath = path.join(optimizedDir, videoFile);
  const posterName = videoFile.replace('.mp4', '.jpg');
  const posterPath = path.join(postersDir, posterName);

  console.log(`\n[${index + 1}/${videoFiles.length}] Обрабатываем: ${videoFile}`);

  // ШАГ 1: Оптимизация видео
  if (fs.existsSync(optimizedPath)) {
    console.log('  ⏭️  Видео уже оптимизировано');
    skippedOptimized++;
  } else {
    try {
      const originalStats = fs.statSync(inputPath);
      const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(1);
      console.log(`  🔄 Оптимизируем видео (${originalSizeMB} MB)...`);

      execSync(
        `ffmpeg -i "${inputPath}" ` +
        `-vf "scale='min(720,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" ` +
        `-c:v libx264 ` +
        `-preset medium ` +
        `-crf 23 ` +
        `-b:v 1500k ` +
        `-maxrate 2000k ` +
        `-bufsize 3000k ` +
        `-c:a aac ` +
        `-b:a 128k ` +
        `-movflags +faststart ` +
        `"${optimizedPath}" -y`,
        { stdio: 'ignore' }
      );

      const optimizedStats = fs.statSync(optimizedPath);
      const optimizedSizeMB = (optimizedStats.size / 1024 / 1024).toFixed(1);
      const reduction = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(0);
      
      console.log(`  ✅ Видео оптимизировано: ${originalSizeMB} MB → ${optimizedSizeMB} MB (-${reduction}%)`);
      optimizedCount++;
    } catch (error) {
      console.error(`  ❌ Ошибка оптимизации: ${error.message}`);
      errorCount++;
    }
  }

  // ШАГ 2: Генерация poster
  if (fs.existsSync(posterPath)) {
    console.log('  ⏭️  Poster уже существует');
    skippedPoster++;
  } else {
    try {
      // Используем оптимизированное видео если оно есть, иначе оригинал
      const sourceVideo = fs.existsSync(optimizedPath) ? optimizedPath : inputPath;
      console.log('  🎬 Генерируем poster...');

      execSync(
        `ffmpeg -i "${sourceVideo}" -ss 00:00:01 -vframes 1 -q:v 2 -vf scale=480:-1 "${posterPath}" -y`,
        { stdio: 'ignore' }
      );

      const posterStats = fs.statSync(posterPath);
      const sizeKB = (posterStats.size / 1024).toFixed(1);
      
      console.log(`  ✅ Poster создан: ${posterName} (${sizeKB} KB)`);
      posterCount++;
    } catch (error) {
      console.error(`  ❌ Ошибка создания poster: ${error.message}`);
      errorCount++;
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 ИТОГИ ОБРАБОТКИ:');
console.log('='.repeat(60));
console.log(`✅ Оптимизировано видео: ${optimizedCount}`);
console.log(`⏭️  Пропущено видео:     ${skippedOptimized}`);
console.log(`✅ Создано poster:       ${posterCount}`);
console.log(`⏭️  Пропущено poster:     ${skippedPoster}`);
console.log(`❌ Ошибок:               ${errorCount}`);
console.log('='.repeat(60));

if (optimizedCount > 0 || posterCount > 0) {
  console.log('\n💡 Следующие шаги:');
  if (optimizedCount > 0) {
    console.log('1. Проверьте качество оптимизированных видео в /public/videos-optimized');
    console.log('2. Если все ОК, замените оригинальные:');
    console.log('   rm -rf public/videos && mv public/videos-optimized public/videos');
  }
  console.log('3. Загрузите файлы в Cloudflare R2: node upload-to-r2.js');
  console.log('4. Обновите src/data/exercises.js с новыми упражнениями');
}

