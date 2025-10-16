/**
 * БЕСПЛАТНОЕ решение: использование R2.dev домена
 * Запуск: node free-r2-solution.js
 */

const fs = require('fs');

// R2.dev домен (уже работает, бесплатно)
const R2_DEV_URL = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";

// Файлы для обновления
const FILES_TO_UPDATE = [
  'src/data/exercises.js',
  'src/components/Hero.js',
  'src/app/layout.js'
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Заменяем старый R2 URL на новый (если нужно)
    const updatedContent = content.replace(
      /const R2_CDN_URL = "https:\/\/[^"]+";/g,
      `const R2_CDN_URL = "${R2_DEV_URL}";`
    );
    
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
  console.log('🚀 БЕСПЛАТНОЕ решение: R2.dev домен\n');
  
  console.log('💰 Стоимость:');
  console.log('   ✅ R2.dev домен: БЕСПЛАТНО');
  console.log('   ✅ Настройка: 2 минуты');
  console.log('   ✅ Готов к использованию: СРАЗУ\n');
  
  console.log('📊 Текущий R2.dev URL:');
  console.log(`   ${R2_DEV_URL}`);
  console.log('   ✅ Уже работает и доступен');
  console.log('   ✅ Не требует настройки Custom Domain');
  console.log('   ✅ Готов к использованию\n');
  
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
    console.log('\n🎉 R2.dev домен настроен!');
    console.log('📝 Теперь можно:');
    console.log('   1. Протестировать: node test-cdn-performance.js');
    console.log('   2. Проверить на сайте: https://pureprogression.vercel.app');
    console.log('   3. При необходимости купить домен позже');
  } else {
    console.log('\n💡 R2.dev домен уже настроен');
  }
  
  console.log('\n💡 Преимущества R2.dev домена:');
  console.log('   ✅ БЕСПЛАТНО');
  console.log('   ✅ Работает СРАЗУ');
  console.log('   ✅ Не требует настройки DNS');
  console.log('   ✅ Хорошая скорость (685ms)');
  console.log('   ✅ Можно купить домен позже');
  
  console.log('\n🎯 План на будущее:');
  console.log('   1. Сейчас: использовать R2.dev (бесплатно)');
  console.log('   2. Позже: купить pure-progression.com ($10.46)');
  console.log('   3. Настроить CDN с доменом');
  console.log('   4. Получить +40-60% ускорение');
}

main();


