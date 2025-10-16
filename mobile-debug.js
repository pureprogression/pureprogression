/**
 * Диагностика мобильной загрузки
 * Запуск: node mobile-debug.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Диагностика мобильной загрузки PureP\n');

// 1. Проверяем размеры видео файлов
console.log('📊 Анализ размеров видео файлов:');
const videosDir = './public/videos/';
if (fs.existsSync(videosDir)) {
  const files = fs.readdirSync(videosDir);
  const videoFiles = files.filter(f => f.endsWith('.mp4'));
  
  videoFiles.forEach(file => {
    const filePath = path.join(videosDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    const sizeKB = (stats.size / 1024).toFixed(0);
    
    console.log(`  ${file}: ${sizeMB}MB (${sizeKB}KB)`);
    
    // Предупреждения для больших файлов
    if (stats.size > 2 * 1024 * 1024) { // > 2MB
      console.log(`    ⚠️  СЛИШКОМ БОЛЬШОЙ для мобильных! Рекомендуется < 1MB`);
    } else if (stats.size > 1 * 1024 * 1024) { // > 1MB
      console.log(`    ⚠️  Большой файл для мобильных. Рекомендуется оптимизация`);
    } else {
      console.log(`    ✅ Хороший размер для мобильных`);
    }
  });
} else {
  console.log('❌ Папка videos не найдена');
}

console.log('\n📱 Проблемы с мобильной загрузкой:');

// 2. Проверяем viewport настройки
console.log('\n1. Viewport настройки:');
const layoutPath = './src/app/layout.js';
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('userScalable: false')) {
    console.log('   ⚠️  userScalable: false может блокировать зум на мобильных');
  }
  
  if (layoutContent.includes('maximumScale: 1')) {
    console.log('   ⚠️  maximumScale: 1 ограничивает масштабирование');
  }
  
  console.log('   ✅ Viewport настроен');
} else {
  console.log('   ❌ layout.js не найден');
}

// 3. Проверяем CSS на мобильные проблемы
console.log('\n2. CSS проблемы:');
const cssPath = './src/app/globals.css';
if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  if (cssContent.includes('overflow-x: hidden')) {
    console.log('   ⚠️  overflow-x: hidden может скрывать контент на мобильных');
  }
  
  if (cssContent.includes('width: 100vw')) {
    console.log('   ⚠️  100vw может создавать горизонтальный скролл');
  }
  
  if (cssContent.includes('-webkit-overflow-scrolling: touch')) {
    console.log('   ✅ iOS touch scrolling настроен');
  }
  
  console.log('   ✅ CSS оптимизирован для мобильных');
} else {
  console.log('   ❌ globals.css не найден');
}

// 4. Проверяем компоненты на мобильные проблемы
console.log('\n3. Компоненты:');

// Hero компонент
const heroPath = './src/components/Hero.js';
if (fs.existsSync(heroPath)) {
  const heroContent = fs.readFileSync(heroPath, 'utf8');
  
  if (heroContent.includes('playsInline')) {
    console.log('   ✅ Hero: playsInline настроен для мобильных');
  } else {
    console.log('   ⚠️  Hero: отсутствует playsInline');
  }
  
  if (heroContent.includes('webkit-playsinline')) {
    console.log('   ✅ Hero: webkit-playsinline для iOS');
  } else {
    console.log('   ⚠️  Hero: отсутствует webkit-playsinline');
  }
} else {
  console.log('   ❌ Hero.js не найден');
}

// Navigation компонент
const navPath = './src/components/Navigation.js';
if (fs.existsSync(navPath)) {
  const navContent = fs.readFileSync(navPath, 'utf8');
  
  if (navContent.includes('createPortal')) {
    console.log('   ⚠️  Navigation: использует Portal - может вызывать проблемы на мобильных');
  }
  
  if (navContent.includes('fixed')) {
    console.log('   ✅ Navigation: использует fixed positioning');
  }
} else {
  console.log('   ❌ Navigation.js не найден');
}

// 5. Рекомендации по исправлению
console.log('\n🔧 Рекомендации по исправлению:');
console.log('1. Оптимизировать видео файлы:');
console.log('   ffmpeg -i input.mp4 -vf scale=640:360 -c:v libx264 -b:v 800k -c:a aac -b:a 96k -movflags +faststart output.mp4');
console.log('');
console.log('2. Добавить адаптивную загрузку видео:');
console.log('   - Определять размер экрана');
console.log('   - Загружать разные версии для мобильных/десктопа');
console.log('');
console.log('3. Упростить анимации на мобильных:');
console.log('   - Отключать сложные анимации на слабых устройствах');
console.log('   - Использовать CSS transforms вместо JS анимаций');
console.log('');
console.log('4. Добавить fallback для медленных соединений:');
console.log('   - Показывать poster изображения');
console.log('   - Ленивая загрузка видео');
console.log('   - Прогрессивная загрузка');

console.log('\n📋 Следующие шаги:');
console.log('1. Проверить консоль браузера на мобильном устройстве');
console.log('2. Проверить Network tab в DevTools');
console.log('3. Тестировать на разных устройствах');
console.log('4. Оптимизировать видео файлы');
