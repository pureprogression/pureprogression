/**
 * Проверка потенциальных проблем с мобильной загрузкой
 * Запуск: node check-mobile-issues.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка потенциальных проблем с мобильной загрузкой\n');

// 1. Проверяем CSS на проблемы
console.log('📱 CSS проблемы:');
const cssPath = './src/app/globals.css';
if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const issues = [];
  
  // Проверяем на проблемные CSS правила
  if (cssContent.includes('overflow-x: hidden')) {
    issues.push('overflow-x: hidden может скрывать контент на мобильных');
  }
  
  if (cssContent.includes('width: 100vw')) {
    issues.push('100vw может создавать горизонтальный скролл на мобильных');
  }
  
  if (cssContent.includes('position: fixed') && cssContent.includes('z-index: 9999')) {
    issues.push('Высокие z-index могут вызывать проблемы с рендерингом на мобильных');
  }
  
  if (cssContent.includes('-webkit-overflow-scrolling: touch')) {
    console.log('  ✅ iOS touch scrolling настроен');
  } else {
    issues.push('Отсутствует -webkit-overflow-scrolling: touch для iOS');
  }
  
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
  } else {
    console.log('  ✅ CSS выглядит нормально');
  }
} else {
  console.log('  ❌ globals.css не найден');
}

// 2. Проверяем JavaScript на проблемы
console.log('\n🔧 JavaScript проблемы:');

// Hero компонент
const heroPath = './src/components/Hero.js';
if (fs.existsSync(heroPath)) {
  const heroContent = fs.readFileSync(heroPath, 'utf8');
  
  const issues = [];
  
  if (heroContent.includes('window.innerWidth')) {
    console.log('  ✅ Hero: определяет размер экрана');
  } else {
    issues.push('Hero: не определяет размер экрана для адаптивности');
  }
  
  if (heroContent.includes('navigator.connection')) {
    console.log('  ✅ Hero: определяет скорость соединения');
  } else {
    issues.push('Hero: не определяет скорость соединения');
  }
  
  if (heroContent.includes('playsInline')) {
    console.log('  ✅ Hero: playsInline настроен');
  } else {
    issues.push('Hero: отсутствует playsInline для мобильных');
  }
  
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`  ⚠️  ${issue}`));
  } else {
    console.log('  ✅ Hero компонент оптимизирован для мобильных');
  }
} else {
  console.log('  ❌ Hero.js не найден');
}

// Navigation компонент
const navPath = './src/components/Navigation.js';
if (fs.existsSync(navPath)) {
  const navContent = fs.readFileSync(navPath, 'utf8');
  
  if (navContent.includes('createPortal')) {
    console.log('  ⚠️  Navigation: использует Portal - может вызывать проблемы на мобильных');
  }
  
  if (navContent.includes('fixed')) {
    console.log('  ✅ Navigation: использует fixed positioning');
  }
} else {
  console.log('  ❌ Navigation.js не найден');
}

// 3. Проверяем layout.js
console.log('\n📄 Layout проблемы:');
const layoutPath = './src/app/layout.js';
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('userScalable: true')) {
    console.log('  ✅ Viewport: userScalable включен');
  } else {
    console.log('  ⚠️  Viewport: userScalable отключен - может блокировать зум');
  }
  
  if (layoutContent.includes('maximumScale: 3')) {
    console.log('  ✅ Viewport: maximumScale увеличен до 3');
  } else {
    console.log('  ⚠️  Viewport: maximumScale ограничен');
  }
} else {
  console.log('  ❌ layout.js не найден');
}

// 4. Проверяем package.json на зависимости
console.log('\n📦 Зависимости:');
const packagePath = './package.json';
if (fs.existsSync(packagePath)) {
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const dependencies = packageContent.dependencies || {};
  
  if (dependencies['framer-motion']) {
    console.log('  ⚠️  framer-motion: может замедлять загрузку на мобильных');
  }
  
  if (dependencies['swiper']) {
    console.log('  ✅ swiper: оптимизирован для мобильных');
  }
  
  if (dependencies['next']) {
    console.log('  ✅ next.js: хорошая производительность');
  }
} else {
  console.log('  ❌ package.json не найден');
}

// 5. Рекомендации
console.log('\n💡 Рекомендации для исправления:');
console.log('1. Откройте mobile-test.html в браузере на мобильном устройстве');
console.log('2. Проверьте консоль браузера на ошибки JavaScript');
console.log('3. Проверьте Network tab в DevTools на медленные запросы');
console.log('4. Убедитесь, что видео загружаются корректно');
console.log('5. Проверьте, что все CSS правила применяются правильно');

console.log('\n🔧 Быстрые исправления:');
console.log('- Убедитесь, что видео имеют правильные атрибуты: playsInline, muted, preload');
console.log('- Проверьте, что нет блокирующих JavaScript ошибок');
console.log('- Убедитесь, что CDN доступен с мобильных устройств');
console.log('- Проверьте, что viewport настроен правильно');
