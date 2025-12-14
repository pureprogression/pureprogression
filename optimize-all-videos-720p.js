const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, 'public', 'videos');
const optimizedDir = path.join(__dirname, 'public', 'videos-optimized');
const postersDir = path.join(__dirname, 'public', 'posters');

// Создаем папки если их нет
[optimizedDir, postersDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Создана папка ${dir.replace(__dirname, '')}`);
  }
});

async function getVideoResolution(filePath) {
  try {
    const output = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${filePath}"`).toString().trim();
    return output; // e.g., "1920x1080"
  } catch (error) {
    return null;
  }
}

async function getVideoSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size / (1024 * 1024); // Размер в МБ
  } catch (error) {
    return 0;
  }
}

async function run() {
  const videoFiles = fs.readdirSync(videosDir).filter(file => file.endsWith('.mp4'));

  console.log(`📹 Найдено ${videoFiles.length} видео файлов\n`);
  console.log('🚀 Начинаем оптимизацию до 720p...\n');

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let successCount = 0;
  let errorCount = 0;
  let recompressedCount = 0;

  for (let i = 0; i < videoFiles.length; i++) {
    const videoFile = videoFiles[i];
    const inputPath = path.join(videosDir, videoFile);
    const outputPath = path.join(optimizedDir, videoFile);
    const posterName = videoFile.replace('.mp4', '.jpg');
    const posterPath = path.join(postersDir, posterName);

    console.log(`[${i + 1}/${videoFiles.length}] Обрабатываем: ${videoFile}`);
    
    const originalStats = fs.statSync(inputPath);
    const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(1);
    const resolution = await getVideoResolution(inputPath);
    
    console.log(`  📐 Текущее разрешение: ${resolution || 'неизвестно'}`);
    console.log(`  📦 Размер: ${originalSizeMB} MB`);

    try {
      // ШАГ 1: Оптимизация до 720p
      console.log('  🔄 Оптимизируем до 720p...');
      
      execSync(
        `ffmpeg -i "${inputPath}" ` +
        `-vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" ` +
        `-c:v libx264 ` +
        `-preset medium ` +
        `-crf 23 ` + // Хорошее качество
        `-b:v 2000k ` + // Битрейт 2000k
        `-maxrate 2500k ` +
        `-bufsize 3000k ` +
        `-an ` + // Без аудио
        `-movflags +faststart ` +
        `"${outputPath}" -y`,
        { stdio: 'ignore' }
      );

      const optimizedStats = fs.statSync(outputPath);
      const optimizedSizeMB = (optimizedStats.size / 1024 / 1024).toFixed(1);
      
      // ШАГ 2: Если видео >5MB после оптимизации, дополнительно сжимаем
      if (optimizedStats.size > 5 * 1024 * 1024) {
        console.log(`  ⚠️  Размер ${optimizedSizeMB} MB > 5MB, применяем дополнительное сжатие...`);
        
        const tempPath = path.join(optimizedDir, `temp_${videoFile}`);
        fs.renameSync(outputPath, tempPath);
        
        execSync(
          `ffmpeg -i "${tempPath}" ` +
          `-vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" ` +
          `-c:v libx264 ` +
          `-preset medium ` +
          `-crf 26 ` + // Увеличиваем CRF для большего сжатия
          `-b:v 1500k ` + // Снижаем битрейт
          `-maxrate 1800k ` +
          `-bufsize 2200k ` +
          `-an ` +
          `-movflags +faststart ` +
          `"${outputPath}" -y`,
          { stdio: 'ignore' }
        );
        
        const finalStats = fs.statSync(outputPath);
        const finalSizeMB = (finalStats.size / 1024 / 1024).toFixed(1);
        const reduction = ((1 - finalStats.size / optimizedStats.size) * 100).toFixed(0);
        
        console.log(`  ✅ Дополнительно сжато: ${optimizedSizeMB} MB → ${finalSizeMB} MB (-${reduction}%)`);
        fs.unlinkSync(tempPath);
        recompressedCount++;
        totalOptimizedSize += finalStats.size;
      } else {
        totalOptimizedSize += optimizedStats.size;
      }

      const finalSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
      const totalReduction = ((1 - fs.statSync(outputPath).size / originalStats.size) * 100).toFixed(0);
      const finalResolution = await getVideoResolution(outputPath);

      console.log(`  ✅ Оптимизировано: ${originalSizeMB} MB → ${finalSizeMB} MB (-${totalReduction}%)`);
      console.log(`  📐 Финальное разрешение: ${finalResolution || 'неизвестно'}`);

      // ШАГ 3: Генерация poster изображения
      if (!fs.existsSync(posterPath)) {
        console.log('  🎬 Генерируем poster...');
        execSync(
          `ffmpeg -i "${outputPath}" -ss 00:00:01 -vframes 1 -q:v 2 -vf scale=480:-1 "${posterPath}" -y`,
          { stdio: 'ignore' }
        );
        const posterStats = fs.statSync(posterPath);
        const posterSizeKB = (posterStats.size / 1024).toFixed(1);
        console.log(`  ✅ Poster создан: ${posterName} (${posterSizeKB} KB)`);
      } else {
        console.log('  ⏭️  Poster уже существует');
      }

      successCount++;
      totalOriginalSize += originalStats.size;

    } catch (error) {
      console.error(`  ❌ Ошибка обработки ${videoFile}:`, error.message);
      errorCount++;
    }
    
    console.log(''); // Пустая строка для читаемости
  }

  // Перемещаем оптимизированные видео обратно в public/videos
  console.log('\n📦 Перемещаем оптимизированные видео в public/videos...');
  fs.readdirSync(optimizedDir).forEach(file => {
    if (file.endsWith('.mp4')) {
      const sourcePath = path.join(optimizedDir, file);
      const targetPath = path.join(videosDir, file);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath); // Удаляем оригинал
      }
      fs.renameSync(sourcePath, targetPath);
    }
  });
  
  // Удаляем временную папку
  if (fs.existsSync(optimizedDir)) {
    try {
      fs.rmdirSync(optimizedDir, { recursive: true });
    } catch (e) {
      // Игнорируем ошибки удаления
    }
  }

  const finalTotalSize = fs.readdirSync(videosDir)
    .filter(f => f.endsWith('.mp4'))
    .reduce((acc, file) => acc + fs.statSync(path.join(videosDir, file)).size, 0);
  const finalTotalMB = (finalTotalSize / 1024 / 1024).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 ИТОГИ ОПТИМИЗАЦИИ:');
  console.log('='.repeat(60));
  console.log(`✅ Успешно оптимизировано: ${successCount}`);
  console.log(`🔄 Дополнительно сжато (>5MB): ${recompressedCount}`);
  console.log(`❌ Ошибок: ${errorCount}`);
  console.log(`📦 Было: ${(totalOriginalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`📦 Стало: ${finalTotalMB} MB`);
  console.log(`💾 Экономия: ${((1 - finalTotalSize / totalOriginalSize) * 100).toFixed(0)}%`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    console.log('\n⚠️  Убедитесь что ffmpeg установлен:');
    console.log('   Mac: brew install ffmpeg');
    console.log('   Ubuntu: sudo apt install ffmpeg');
    console.log('   Windows: https://ffmpeg.org/download.html');
  }
  
  console.log('\n💡 Все видео оптимизированы до 720p');
  console.log('   Следующий шаг: загрузить в R2 (node upload-to-r2.js)');
}

run().catch(console.error);

