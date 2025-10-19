/**
 * Проверка текущего статуса домена и CDN
 * Запуск: node check-current-status.js
 */

const fs = require('fs');

function checkCurrentConfiguration() {
  console.log('🔍 Проверка текущей конфигурации...\n');
  
  // Проверяем файлы
  const files = [
    'src/data/exercises.js',
    'src/components/Hero.js',
    'src/app/layout.js'
  ];
  
  let currentDomain = null;
  
  files.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Ищем R2_CDN_URL или source src
      const r2Match = content.match(/const R2_CDN_URL = "([^"]+)"/);
      const srcMatch = content.match(/src="([^"]*r2\.dev[^"]*)"/);
      
      if (r2Match) {
        currentDomain = r2Match[1];
        console.log(`📁 ${filePath}:`);
        console.log(`   R2_CDN_URL: ${r2Match[1]}`);
      }
      
      if (srcMatch) {
        console.log(`   Source src: ${srcMatch[1]}`);
      }
      
      console.log();
    }
  });
  
  // Анализ
  console.log('📊 Анализ текущей ситуации:');
  
  if (currentDomain && currentDomain.includes('r2.dev')) {
    console.log('✅ Используется R2.dev домен');
    console.log('❌ CDN НЕ настроен (нет Custom Domain)');
    console.log('💡 Для CDN нужен домен типа cdn.pureprogression.com');
  } else if (currentDomain && currentDomain.includes('cdn.')) {
    console.log('✅ Используется CDN домен');
    console.log('💡 CDN настроен');
  } else {
    console.log('❓ Неизвестная конфигурация');
  }
  
  console.log('\n🎯 Варианты действий:');
  console.log('1. Оставить R2.dev домен (работает, бесплатно)');
  console.log('2. Купить pure-progression.com ($10.46) и настроить CDN');
  console.log('3. Использовать pureprogression.ru для CDN');
  console.log('4. Использовать Vercel домен (pureprogression.vercel.app)');
  
  console.log('\n💡 Рекомендация:');
  console.log('Сейчас: R2.dev домен работает хорошо (1037ms)');
  console.log('Позже: купить домен для профессионального CDN');
}

checkCurrentConfiguration();




