/**
 * Оптимизация webHeroAuth.mp4 для уменьшения размера
 * Запуск: node optimize-hero-auth-video.js
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = './public/videos/webHeroAuth.mp4';
const OUTPUT_FILE = './public/videos/webHeroAuth_optimized.mp4';

function checkFileSize() {
  console.log('📊 Анализ текущего видео...\n');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.log('❌ Файл webHeroAuth.mp4 не найден в public/videos/');
    return false;
  }
  
  const stats = fs.statSync(INPUT_FILE);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(`📁 Файл: ${INPUT_FILE}`);
  console.log(`📊 Размер: ${sizeMB}MB`);
  console.log(`📅 Дата: ${stats.mtime.toLocaleString()}`);
  
  return true;
}

function showOptimizationOptions() {
  console.log('\n🎯 Варианты оптимизации:\n');
  
  console.log('1. 📱 Мобильная оптимизация (360p, 1Mbps):');
  console.log('   - Размер: ~2-3MB');
  console.log('   - Качество: Хорошее для мобильных');
  console.log('   - Команда: ffmpeg -i input.mp4 -vf scale=640:360 -c:v libx264 -b:v 1M -c:a aac -b:a 128k output.mp4\n');
  
  console.log('2. 🖥️  Стандартная оптимизация (720p, 2Mbps):');
  console.log('   - Размер: ~4-6MB');
  console.log('   - Качество: Отличное для десктопа');
  console.log('   - Команда: ffmpeg -i input.mp4 -vf scale=1280:720 -c:v libx264 -b:v 2M -c:a aac -b:a 128k output.mp4\n');
  
  console.log('3. 🎬 Высокое качество (1080p, 3Mbps):');
  console.log('   - Размер: ~6-8MB');
  console.log('   - Качество: Премиум для больших экранов');
  console.log('   - Команда: ffmpeg -i input.mp4 -vf scale=1920:1080 -c:v libx264 -b:v 3M -c:a aac -b:a 128k output.mp4\n');
  
  console.log('4. ⚡ Максимальная оптимизация (480p, 800kbps):');
  console.log('   - Размер: ~1-2MB');
  console.log('   - Качество: Базовое, но быстрое');
  console.log('   - Команда: ffmpeg -i input.mp4 -vf scale=854:480 -c:v libx264 -b:v 800k -c:a aac -b:a 96k output.mp4\n');
}

function generateOptimizationScripts() {
  console.log('📝 Готовые команды для оптимизации:\n');
  
  const scripts = [
    {
      name: 'Мобильная оптимизация',
      command: `ffmpeg -i "${INPUT_FILE}" -vf scale=640:360 -c:v libx264 -b:v 1M -c:a aac -b:a 128k -movflags +faststart "${OUTPUT_FILE}"`,
      description: 'Размер: ~2-3MB, Качество: Хорошее'
    },
    {
      name: 'Стандартная оптимизация', 
      command: `ffmpeg -i "${INPUT_FILE}" -vf scale=1280:720 -c:v libx264 -b:v 2M -c:a aac -b:a 128k -movflags +faststart "${OUTPUT_FILE}"`,
      description: 'Размер: ~4-6MB, Качество: Отличное'
    },
    {
      name: 'Максимальная оптимизация',
      command: `ffmpeg -i "${INPUT_FILE}" -vf scale=854:480 -c:v libx264 -b:v 800k -c:a aac -b:a 96k -movflags +faststart "${OUTPUT_FILE}"`,
      description: 'Размер: ~1-2MB, Качество: Базовое'
    }
  ];
  
  scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.name} (${script.description}):`);
    console.log(`   ${script.command}\n`);
  });
  
  console.log('💡 Рекомендация:');
  console.log('   🎯 Стандартная оптимизация (720p, 2Mbps)');
  console.log('   📊 Ожидаемый размер: 4-6MB (вместо 13.32MB)');
  console.log('   ⚡ Ускорение загрузки: 60-70%');
  console.log('   🎬 Качество: Отличное для всех устройств');
  
  console.log('\n🚀 После оптимизации:');
  console.log('   1. Заменить оригинальный файл');
  console.log('   2. Загрузить оптимизированную версию в R2');
  console.log('   3. Обновить код (если нужно)');
}

function main() {
  console.log('🎬 Оптимизация webHeroAuth.mp4\n');
  
  if (!checkFileSize()) {
    return;
  }
  
  showOptimizationOptions();
  generateOptimizationScripts();
  
  console.log('\n📋 Следующие шаги:');
  console.log('1. Выбрать вариант оптимизации');
  console.log('2. Выполнить команду ffmpeg');
  console.log('3. Проверить результат');
  console.log('4. Заменить файл в R2');
}

main();

