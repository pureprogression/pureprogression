/**
 * Тест мобильной загрузки
 * Запуск: node test-mobile-loading.js
 */

const fs = require('fs');

console.log('📱 Тест мобильной загрузки PureP\n');

// Проверяем, что все файлы на месте
const filesToCheck = [
  'src/components/Hero.js',
  'src/components/MobileHero.js',
  'src/app/layout.js',
  'src/app/globals.css',
  'mobile-test.html'
];

console.log('📁 Проверка файлов:');
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - не найден`);
  }
});

// Проверяем изменения в Hero.js
console.log('\n🔧 Проверка изменений в Hero.js:');
const heroContent = fs.readFileSync('src/components/Hero.js', 'utf8');

if (heroContent.includes('MobileHero')) {
  console.log('  ✅ MobileHero импортирован');
} else {
  console.log('  ❌ MobileHero не импортирован');
}

if (heroContent.includes('isMobile')) {
  console.log('  ✅ Определение мобильного устройства добавлено');
} else {
  console.log('  ❌ Определение мобильного устройства отсутствует');
}

if (heroContent.includes('if (isMobile)')) {
  console.log('  ✅ Условный рендеринг для мобильных добавлен');
} else {
  console.log('  ❌ Условный рендеринг для мобильных отсутствует');
}

// Проверяем MobileHero.js
console.log('\n📱 Проверка MobileHero.js:');
const mobileHeroContent = fs.readFileSync('src/components/MobileHero.js', 'utf8');

if (mobileHeroContent.includes('preload="metadata"')) {
  console.log('  ✅ preload="metadata" настроен');
} else {
  console.log('  ❌ preload не настроен');
}

if (mobileHeroContent.includes('showFallback')) {
  console.log('  ✅ Fallback для медленных соединений добавлен');
} else {
  console.log('  ❌ Fallback отсутствует');
}

if (mobileHeroContent.includes('onLoadedData')) {
  console.log('  ✅ Обработчик загрузки видео добавлен');
} else {
  console.log('  ❌ Обработчик загрузки отсутствует');
}

// Проверяем CSS изменения
console.log('\n🎨 Проверка CSS изменений:');
const cssContent = fs.readFileSync('src/app/globals.css', 'utf8');

if (cssContent.includes('width: 100%') && !cssContent.includes('width: 100vw')) {
  console.log('  ✅ 100vw заменен на 100%');
} else {
  console.log('  ❌ 100vw не заменен');
}

// Проверяем layout.js
console.log('\n📄 Проверка layout.js:');
const layoutContent = fs.readFileSync('src/app/layout.js', 'utf8');

if (layoutContent.includes('userScalable: true')) {
  console.log('  ✅ userScalable включен');
} else {
  console.log('  ❌ userScalable не включен');
}

if (layoutContent.includes('maximumScale: 3')) {
  console.log('  ✅ maximumScale увеличен до 3');
} else {
  console.log('  ❌ maximumScale не увеличен');
}

console.log('\n🚀 Следующие шаги:');
console.log('1. Запустите приложение: npm run dev');
console.log('2. Откройте mobile-test.html в браузере на мобильном устройстве');
console.log('3. Проверьте, что видео загружаются корректно');
console.log('4. Проверьте консоль браузера на ошибки');
console.log('5. Протестируйте на разных мобильных устройствах');

console.log('\n💡 Если проблемы остаются:');
console.log('- Проверьте Network tab в DevTools');
console.log('- Убедитесь, что CDN доступен с мобильных');
console.log('- Проверьте, что нет блокирующих JavaScript ошибок');
console.log('- Попробуйте отключить Framer Motion на мобильных');
