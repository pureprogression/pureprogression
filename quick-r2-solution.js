/**
 * Быстрое решение: использование R2.dev домена
 * Запуск: node quick-r2-solution.js
 */

const fs = require('fs');

// R2.dev домен (уже работает)
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
  console.log('🚀 Быстрое решение: использование R2.dev домена\n');
  
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
    console.log('   3. При необходимости настроить Custom Domain позже');
  } else {
    console.log('\n💡 R2.dev домен уже настроен');
  }
  
  console.log('\n💡 Для максимальной скорости:');
  console.log('   - Настроить Custom Domain в Cloudflare');
  console.log('   - Добавить Page Rules для кеширования');
  console.log('   - Включить Brotli сжатие');
}

main();




