/**
 * Скрипт для быстрого переключения на Cloudflare CDN
 * Запуск: node update-to-cdn.js
 */

const fs = require('fs');
const path = require('path');

// Новый CDN URL (замените на ваш после настройки)
const NEW_CDN_URL = "https://cdn.pureprogression.com";

// Альтернативные варианты CDN URL
const CDN_ALTERNATIVES = [
  "https://cdn.pureprogression.com",
  "https://assets.pureprogression.com", 
  "https://media.pureprogression.com",
  "https://static.pureprogression.com"
];

// Файлы для обновления
const FILES_TO_UPDATE = [
  'src/data/exercises.js',
  'src/components/Hero.js',
  'src/app/layout.js'
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Заменяем старый R2 URL на новый CDN URL
    const oldUrl = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
    const newUrl = NEW_CDN_URL;
    
    const updatedContent = content.replace(new RegExp(oldUrl, 'g'), newUrl);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Обновлен: ${filePath}`);
      return true;
    } else {
      console.log(`⚪ Без изменений: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Ошибка обновления ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 Переключение на Cloudflare CDN...\n');
  
  let updatedCount = 0;
  
  FILES_TO_UPDATE.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      if (updateFile(filePath)) {
        updatedCount++;
      }
    } else {
      console.log(`⚠️  Файл не найден: ${filePath}`);
    }
  });
  
  console.log(`\n📊 Результат: обновлено ${updatedCount} файлов`);
  
  if (updatedCount > 0) {
    console.log('\n🎉 Переключение на CDN завершено!');
    console.log('📝 Не забудьте:');
    console.log('   1. Настроить Custom Domain в Cloudflare R2');
    console.log('   2. Проверить работу на https://pureprogression.vercel.app');
    console.log('   3. Протестировать скорость загрузки');
  } else {
    console.log('\n💡 URL уже обновлены или файлы не найдены');
  }
}

main();
