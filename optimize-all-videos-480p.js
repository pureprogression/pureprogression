/**
 * Единый скрипт для оптимизации всех видео до стандарта 480p
 * - Разрешение: 480p (854x480 для 16:9)
 * - CRF: 25 (баланс качества/размера)
 * - Bitrate: 1000-1200k
 * - Без аудио
 * - Пропускает уже оптимизированные видео
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

/**
 * Получает разрешение видео через ffprobe
 */
function getVideoResolution(videoPath) {
  try {
    const output = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${videoPath}"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    ).trim();
    
    const [width, height] = output.split('x').map(Number);
    return { width, height };
  } catch (error) {
    console.error(`  ⚠️  Не удалось определить разрешение: ${error.message}`);
    return null;
  }
}

/**
 * Проверяет, нужно ли оптимизировать видео
 */
function needsOptimization(videoPath) {
  const resolution = getVideoResolution(videoPath);
  if (!resolution) return true; // Если не удалось определить - оптимизируем
  
  // Если высота больше 480px - нужно оптимизировать
  return resolution.height > 480;
}

// Получаем все видео файлы
const videoFiles = fs.readdirSync(videosDir)
  .filter(file => file.endsWith('.mp4'))
  .map(file => ({
    name: file,
    path: path.join(videosDir, file)
  }));

console.log(`📹 Найдено ${videoFiles.length} видео файлов\n`);
console.log('🔍 Проверяем какие видео нужно оптимизировать...\n');

let needOptimization = [];
let alreadyOptimized = [];

videoFiles.forEach((video, index) => {
  const needsOpt = needsOptimization(video.path);
  if (needsOpt) {
    needOptimization.push(video);
  } else {
    alreadyOptimized.push(video);
  }
});

console.log(`✅ Уже оптимизированы (480p или меньше): ${alreadyOptimized.length}`);
console.log(`🔄 Требуют оптимизации: ${needOptimization.length}\n`);

if (needOptimization.length === 0) {
  console.log('✅ Все видео уже оптимизированы до 480p!');
  if (fs.existsSync(tempDir)) {
    fs.rmdirSync(tempDir);
  }
  process.exit(0);
}

console.log('🚀 Начинаем оптимизацию...\n');

let successCount = 0;
let errorCount = 0;
let totalOriginalSize = 0;
let totalOptimizedSize = 0;

needOptimization.forEach((video, index) => {
  const originalStats = fs.statSync(video.path);
  const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(1);
  const resolution = getVideoResolution(video.path);
  const resolutionStr = resolution ? `${resolution.width}x${resolution.height}` : 'неизвестно';
  
  console.log(`[${index + 1}/${needOptimization.length}] ${video.name}`);
  console.log(`  📐 Текущее разрешение: ${resolutionStr}`);
  console.log(`  📦 Размер: ${originalSizeMB} MB`);
  
  const outputPath = path.join(tempDir, video.name);
  totalOriginalSize += originalStats.size;
  
  try {
    console.log('  🔄 Оптимизируем до 480p...');
    
    // Оптимизация до 480p:
    // - Разрешение: максимум 480px по высоте, пропорционально по ширине
    // - CRF: 25 (баланс качества/размера)
    // - Bitrate: 1000k с максимумом 1200k
    // - Без аудио (-an)
    // - faststart для веб-стриминга
    
    execSync(
      `ffmpeg -i "${video.path}" ` +
      `-vf "scale='min(854,iw)':'min(480,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" ` +
      `-c:v libx264 ` +
      `-preset medium ` +
      `-crf 25 ` +
      `-b:v 1000k ` +
      `-maxrate 1200k ` +
      `-bufsize 1500k ` +
      `-an ` + // Без аудио
      `-movflags +faststart ` +
      `"${outputPath}" -y`,
      { stdio: 'ignore' }
    );
    
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSizeMB = (optimizedStats.size / 1024 / 1024).toFixed(1);
    const reduction = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(0);
    
    // Проверяем финальное разрешение
    const finalResolution = getVideoResolution(outputPath);
    const finalResolutionStr = finalResolution ? `${finalResolution.width}x${finalResolution.height}` : 'неизвестно';
    
    totalOptimizedSize += optimizedStats.size;
    
    console.log(`  ✅ Оптимизировано: ${originalSizeMB} MB → ${optimizedSizeMB} MB (-${reduction}%)`);
    console.log(`  📐 Финальное разрешение: ${finalResolutionStr}\n`);
    
    // Заменяем оригинал
    fs.renameSync(outputPath, video.path);
    successCount++;
  } catch (error) {
    console.error(`  ❌ Ошибка: ${error.message}\n`);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    errorCount++;
  }
});

// Удаляем временную папку
if (fs.existsSync(tempDir)) {
  try {
    fs.rmdirSync(tempDir);
  } catch (e) {
    // Игнорируем ошибки если папка не пустая
  }
}

const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(1);
const totalOptimizedMB = (totalOptimizedSize / 1024 / 1024).toFixed(1);
const totalReduction = totalOriginalSize > 0 ? ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(0) : 0;

console.log('='.repeat(60));
console.log('📊 ИТОГИ ОПТИМИЗАЦИИ:');
console.log('='.repeat(60));
console.log(`✅ Успешно оптимизировано: ${successCount}`);
console.log(`⏭️  Уже оптимизированы:     ${alreadyOptimized.length}`);
console.log(`❌ Ошибок:                   ${errorCount}`);
console.log(`📦 Было:                     ${totalOriginalMB} MB`);
console.log(`📦 Стало:                    ${totalOptimizedMB} MB`);
console.log(`💾 Экономия:                 ${totalReduction}%`);
console.log('='.repeat(60));

console.log('\n💡 Все видео теперь в едином стандарте 480p без аудио');
console.log('   Следующий шаг: загрузите в R2 (node upload-to-r2.js)');

