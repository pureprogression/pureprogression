/**
 * Оптимизация видео для мобильных устройств
 * Запуск: node optimize-mobile-videos.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📱 Оптимизация видео для мобильных устройств\n');

const videosDir = './public/videos/';
const outputDir = './public/videos/mobile/';

// Создаем папку для мобильных версий
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Список видео для оптимизации
const videosToOptimize = [
  'webHeroAuth.mp4',
  'work60.mp4',
  'x51.mp4',
  'x51web.mp4',
  'x93.mp4'
];

console.log('🎯 Оптимизируем следующие видео:');
videosToOptimize.forEach(video => {
  const inputPath = path.join(videosDir, video);
  if (fs.existsSync(inputPath)) {
    const stats = fs.statSync(inputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  ${video}: ${sizeMB}MB`);
  } else {
    console.log(`  ❌ ${video}: файл не найден`);
  }
});

console.log('\n🔧 Команды для оптимизации:\n');

videosToOptimize.forEach(video => {
  const inputPath = path.join(videosDir, video);
  const outputPath = path.join(outputDir, video);
  
  if (fs.existsSync(inputPath)) {
    console.log(`# Оптимизация ${video}:`);
    console.log(`ffmpeg -i "${inputPath}" -vf scale=640:360 -c:v libx264 -b:v 600k -c:a aac -b:a 64k -movflags +faststart "${outputPath}"`);
    console.log('');
  }
});

console.log('📊 Ожидаемые результаты:');
console.log('- Размер файлов: 200-500KB (вместо 1-3MB)');
console.log('- Разрешение: 640x360 (оптимально для мобильных)');
console.log('- Битрейт: 600kbps (быстрая загрузка)');
console.log('- Аудио: 64kbps (достаточно для фона)');

console.log('\n🚀 После оптимизации:');
console.log('1. Загрузить мобильные версии в R2');
console.log('2. Обновить Hero компонент для использования мобильных версий');
console.log('3. Тестировать на реальных мобильных устройствах');

// Автоматическая оптимизация (если ffmpeg доступен)
console.log('\n🤖 Автоматическая оптимизация:');
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
  console.log('✅ FFmpeg найден, начинаем оптимизацию...\n');
  
  videosToOptimize.forEach(video => {
    const inputPath = path.join(videosDir, video);
    const outputPath = path.join(outputDir, video);
    
    if (fs.existsSync(inputPath)) {
      try {
        console.log(`🔄 Оптимизируем ${video}...`);
        const command = `ffmpeg -i "${inputPath}" -vf scale=640:360 -c:v libx264 -b:v 600k -c:a aac -b:a 64k -movflags +faststart "${outputPath}"`;
        execSync(command, { stdio: 'inherit' });
        
        // Проверяем результат
        if (fs.existsSync(outputPath)) {
          const originalSize = fs.statSync(inputPath).size;
          const optimizedSize = fs.statSync(outputPath).size;
          const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
          
          console.log(`✅ ${video}: ${(originalSize/1024/1024).toFixed(2)}MB → ${(optimizedSize/1024/1024).toFixed(2)}MB (${reduction}% меньше)`);
        }
      } catch (error) {
        console.log(`❌ Ошибка при оптимизации ${video}:`, error.message);
      }
    }
  });
  
  console.log('\n🎉 Оптимизация завершена!');
  console.log('📁 Мобильные версии сохранены в:', outputDir);
  
} catch (error) {
  console.log('❌ FFmpeg не найден. Установите FFmpeg для автоматической оптимизации.');
  console.log('💡 Или выполните команды вручную (см. выше).');
}
