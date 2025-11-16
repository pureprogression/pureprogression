/**
 * Загрузка webHeroAuth.mp4 в R2 bucket
 * Запуск: node upload-hero-auth-video.js
 */

const fs = require('fs');
const path = require('path');

// Конфигурация R2
const R2_CONFIG = {
  bucketName: 'pub-24028780ba564e299106a5335d66f54c',
  region: 'auto',
  endpoint: 'https://pub-24028780ba564e299106a5335d66f54c.r2.dev'
};

async function uploadToR2() {
  const localFilePath = './public/videos/webHeroAuth.mp4';
  
  console.log('🚀 Загрузка webHeroAuth.mp4 в R2...\n');
  
  // Проверяем существование файла
  if (!fs.existsSync(localFilePath)) {
    console.log('❌ Файл webHeroAuth.mp4 не найден в public/videos/');
    console.log('💡 Убедитесь что файл загружен в правильную папку');
    return;
  }
  
  const fileSize = fs.statSync(localFilePath).size;
  console.log(`📁 Файл найден: ${localFilePath}`);
  console.log(`📊 Размер: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
  
  console.log('\n📋 Инструкции для загрузки:');
  console.log('1. Открыть Cloudflare Dashboard');
  console.log('2. Перейти в R2 Object Storage');
  console.log('3. Выбрать bucket: pub-24028780ba564e299106a5335d66f54c');
  console.log('4. Нажать "Upload"');
  console.log('5. Выбрать файл: public/videos/webHeroAuth.mp4');
  console.log('6. Загрузить в папку /videos/');
  
  console.log('\n🌐 После загрузки файл будет доступен по адресу:');
  console.log('   https://pub-24028780ba564e299106a5335d66f54c.r2.dev/videos/webHeroAuth.mp4');
  
  console.log('\n✅ Код уже обновлен для использования нового видео!');
  console.log('📝 После загрузки в R2:');
  console.log('   - Неавторизованные пользователи: webHero.mp4');
  console.log('   - Авторизованные пользователи: webHeroAuth.mp4');
}

uploadToR2().catch(console.error);







