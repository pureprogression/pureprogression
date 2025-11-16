/**
 * Настройка CDN с доменом pureprogression.ru
 * Запуск: node use-pureprogression-ru.js
 */

const fs = require('fs');

// CDN URL для pureprogression.ru
const NEW_CDN_URL = "https://cdn.pureprogression.ru";

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
    const updatedContent = content.replace(new RegExp(oldUrl, 'g'), NEW_CDN_URL);
    
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
  console.log('🚀 Настройка CDN с доменом pureprogression.ru...\n');
  
  console.log('📊 Новый CDN URL:');
  console.log(`   ${NEW_CDN_URL}`);
  console.log('   ✅ Используем ваш существующий домен .ru\n');
  
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
    console.log('\n🎉 Код обновлен для cdn.pureprogression.ru!');
    console.log('📝 Следующие шаги:');
    console.log('   1. Добавить домен pureprogression.ru в Cloudflare');
    console.log('   2. Настроить DNS записи для cdn.pureprogression.ru');
    console.log('   3. Подключить Custom Domain в R2');
    console.log('   4. Протестировать: node test-cdn-performance.js');
  } else {
    console.log('\n💡 Код уже обновлен');
  }
  
  console.log('\n🎯 Ожидаемый результат:');
  console.log('   ⚡ Ускорение загрузки: +40-60%');
  console.log('   🌍 Географическое распределение: 200+ датацентров');
  console.log('   🗄️ Автоматическое кеширование');
}

main();







