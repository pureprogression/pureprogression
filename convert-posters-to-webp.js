/**
 * Конвертация постеров в WebP для ускорения загрузки
 * WebP на 25-50% меньше чем JPG при том же качестве
 */

const fs = require('fs');
const path = require('path');

// Установить: npm install sharp
const sharp = require('sharp');

async function convertPostersToWebP() {
  const postersDir = './public/posters';
  const files = fs.readdirSync(postersDir);
  
  console.log('🔄 Конвертируем постеры в WebP...');
  
  for (const file of files) {
    if (file.endsWith('.jpg')) {
      const inputPath = path.join(postersDir, file);
      const outputPath = path.join(postersDir, file.replace('.jpg', '.webp'));
      
      try {
        await sharp(inputPath)
          .webp({ 
            quality: 85, // Качество 85% - оптимальный баланс
            effort: 6    // Максимальное сжатие
          })
          .toFile(outputPath);
          
        // Сравним размеры
        const originalSize = fs.statSync(inputPath).size;
        const webpSize = fs.statSync(outputPath).size;
        const saved = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
        
        console.log(`✅ ${file}: ${(originalSize/1024).toFixed(1)}KB → ${(webpSize/1024).toFixed(1)}KB (${saved}% экономии)`);
        
      } catch (error) {
        console.error(`❌ Ошибка конвертации ${file}:`, error.message);
      }
    }
  }
  
  console.log('🎉 Конвертация завершена!');
}

// Запуск: node convert-posters-to-webp.js
convertPostersToWebP().catch(console.error);

