/**
 * Скрипт для тестирования производительности загрузки видео
 * Запуск: node performance-test.js
 */

const https = require('https');
const fs = require('fs');

const R2_URL = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
const TEST_VIDEOS = [
  '/videos/webHero.mp4',
  '/videos/x92.mp4', 
  '/videos/x93.mp4'
];

function measureLoadTime(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      let dataSize = 0;
      
      res.on('data', (chunk) => {
        dataSize += chunk.length;
      });
      
      res.on('end', () => {
        const loadTime = Date.now() - startTime;
        resolve({
          url,
          loadTime,
          dataSize,
          speed: (dataSize / 1024 / 1024) / (loadTime / 1000) // MB/s
        });
      });
      
    }).on('error', reject);
  });
}

async function runPerformanceTest() {
  console.log('🚀 Тестирование скорости загрузки видео...\n');
  
  const results = [];
  
  for (const video of TEST_VIDEOS) {
    const url = R2_URL + video;
    console.log(`📹 Тестирую: ${video}`);
    
    try {
      const result = await measureLoadTime(url);
      results.push(result);
      
      console.log(`   ⏱️  Время: ${result.loadTime}ms`);
      console.log(`   📊 Размер: ${(result.dataSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   🏃 Скорость: ${result.speed.toFixed(2)}MB/s\n`);
      
    } catch (error) {
      console.error(`   ❌ Ошибка: ${error.message}\n`);
    }
  }
  
  // Статистика
  if (results.length > 0) {
    const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
    const avgSpeed = results.reduce((sum, r) => sum + r.speed, 0) / results.length;
    
    console.log('📈 Результаты:');
    console.log(`   Среднее время загрузки: ${avgLoadTime.toFixed(0)}ms`);
    console.log(`   Средняя скорость: ${avgSpeed.toFixed(2)}MB/s`);
    
    // Рекомендации
    console.log('\n💡 Рекомендации:');
    if (avgLoadTime > 3000) {
      console.log('   ⚠️  Загрузка медленная (>3с) - нужен CDN');
    }
    if (avgSpeed < 1) {
      console.log('   ⚠️  Низкая скорость (<1MB/s) - проверьте соединение');
    }
    if (avgLoadTime < 1500 && avgSpeed > 2) {
      console.log('   ✅ Отличная производительность!');
    }
  }
}

// Запуск теста
runPerformanceTest().catch(console.error);




