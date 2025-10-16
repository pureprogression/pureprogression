/**
 * Тест производительности CDN vs R2
 * Запуск: node test-cdn-performance.js
 */

const https = require('https');

const R2_URL = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
const CDN_URL = "https://cdn.pureprogression.com"; // После настройки
const TEST_VIDEO = "/videos/webHero.mp4";

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
          speed: (dataSize / 1024 / 1024) / (loadTime / 1000),
          headers: {
            'cf-cache-status': res.headers['cf-cache-status'],
            'cf-ray': res.headers['cf-ray'],
            'server': res.headers['server']
          }
        });
      });
      
    }).on('error', reject);
  });
}

async function testBothSources() {
  console.log('🚀 Тестирование R2 vs CDN производительности...\n');
  
  const results = {};
  
  // Тест R2 (текущий)
  console.log('📹 Тестирую R2 (текущий):');
  try {
    results.r2 = await measureLoadTime(R2_URL + TEST_VIDEO);
    console.log(`   ⏱️  Время: ${results.r2.loadTime}ms`);
    console.log(`   🏃 Скорость: ${results.r2.speed.toFixed(2)}MB/s`);
    console.log(`   📊 Размер: ${(results.r2.dataSize / 1024 / 1024).toFixed(2)}MB\n`);
  } catch (error) {
    console.error(`   ❌ Ошибка R2: ${error.message}\n`);
  }
  
  // Тест CDN (после настройки)
  console.log('🌍 Тестирую CDN (после настройки):');
  try {
    results.cdn = await measureLoadTime(CDN_URL + TEST_VIDEO);
    console.log(`   ⏱️  Время: ${results.cdn.loadTime}ms`);
    console.log(`   🏃 Скорость: ${results.cdn.speed.toFixed(2)}MB/s`);
    console.log(`   📊 Размер: ${(results.cdn.dataSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Cloudflare заголовки
    if (results.cdn.headers['cf-cache-status']) {
      console.log(`   🗄️  Кеш статус: ${results.cdn.headers['cf-cache-status']}`);
    }
    if (results.cdn.headers['cf-ray']) {
      console.log(`   🌐 CF-Ray: ${results.cdn.headers['cf-ray']}`);
    }
    console.log();
    
  } catch (error) {
    console.error(`   ❌ Ошибка CDN: ${error.message}`);
    console.log('   💡 CDN еще не настроен или домен не подключен\n');
  }
  
  // Сравнение результатов
  if (results.r2 && results.cdn) {
    const improvement = ((results.r2.loadTime - results.cdn.loadTime) / results.r2.loadTime * 100).toFixed(1);
    const speedImprovement = ((results.cdn.speed - results.r2.speed) / results.r2.speed * 100).toFixed(1);
    
    console.log('📈 Сравнение результатов:');
    console.log(`   ⚡ Ускорение загрузки: ${improvement}%`);
    console.log(`   🚀 Увеличение скорости: ${speedImprovement}%`);
    
    if (parseFloat(improvement) > 0) {
      console.log('   🎉 CDN работает быстрее!');
    } else {
      console.log('   ⚠️  CDN медленнее или не настроен');
    }
  } else if (results.r2) {
    console.log('📊 Текущая производительность R2:');
    console.log(`   ⏱️  Время загрузки: ${results.r2.loadTime}ms`);
    console.log(`   🏃 Скорость: ${results.r2.speed.toFixed(2)}MB/s`);
    console.log('   💡 Настройте CDN для улучшения производительности');
  }
}

testBothSources().catch(console.error);


