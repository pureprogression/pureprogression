/**
 * Быстрый тест CDN с временным доменом
 * Запуск: node quick-cdn-test.js
 */

const https = require('https');

// Возможные варианты CDN доменов для тестирования
const CDN_CANDIDATES = [
  "https://cdn.pureprogression.com",
  "https://assets.pureprogression.com", 
  "https://media.pureprogression.com",
  "https://static.pureprogression.com"
];

const TEST_VIDEO = "/videos/webHero.mp4";
const R2_URL = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";

function testCDN(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = https.get(url + TEST_VIDEO, (res) => {
      let dataSize = 0;
      
      res.on('data', (chunk) => {
        dataSize += chunk.length;
      });
      
      res.on('end', () => {
        const loadTime = Date.now() - startTime;
        resolve({
          url,
          status: res.statusCode,
          loadTime,
          dataSize,
          speed: (dataSize / 1024 / 1024) / (loadTime / 1000),
          headers: {
            'cf-cache-status': res.headers['cf-cache-status'],
            'cf-ray': res.headers['cf-ray'],
            'server': res.headers['server'],
            'x-cache': res.headers['x-cache']
          },
          working: res.statusCode === 200
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message,
        working: false
      });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
        working: false
      });
    });
  });
}

async function testAllCDNCandidates() {
  console.log('🚀 Тестирование CDN кандидатов...\n');
  
  // Сначала тестируем R2 для сравнения
  console.log('📊 Базовый тест R2:');
  const r2Result = await testCDN(R2_URL);
  if (r2Result.working) {
    console.log(`   ⏱️  Время: ${r2Result.loadTime}ms`);
    console.log(`   🏃 Скорость: ${r2Result.speed.toFixed(2)}MB/s\n`);
  }
  
  // Тестируем все CDN кандидаты
  const results = [];
  
  for (const cdnUrl of CDN_CANDIDATES) {
    console.log(`🌍 Тестирую: ${cdnUrl}`);
    const result = await testCDN(cdnUrl);
    results.push(result);
    
    if (result.working) {
      const improvement = ((r2Result.loadTime - result.loadTime) / r2Result.loadTime * 100).toFixed(1);
      console.log(`   ✅ Работает! (${result.status})`);
      console.log(`   ⏱️  Время: ${result.loadTime}ms (${improvement > 0 ? '+' : ''}${improvement}%)`);
      console.log(`   🏃 Скорость: ${result.speed.toFixed(2)}MB/s`);
      
      if (result.headers['cf-cache-status']) {
        console.log(`   🗄️  Кеш: ${result.headers['cf-cache-status']}`);
      }
      if (result.headers['cf-ray']) {
        console.log(`   🌐 CF-Ray: ${result.headers['cf-ray']}`);
      }
    } else {
      console.log(`   ❌ Не работает (${result.status})`);
      if (result.error) {
        console.log(`   💡 ${result.error}`);
      }
    }
    console.log();
  }
  
  // Находим лучший CDN
  const workingCDNs = results.filter(r => r.working);
  
  if (workingCDNs.length > 0) {
    const bestCDN = workingCDNs.reduce((best, current) => 
      current.loadTime < best.loadTime ? current : best
    );
    
    console.log('🏆 ЛУЧШИЙ CDN:');
    console.log(`   ${bestCDN.url}`);
    console.log(`   ⚡ Ускорение: ${((r2Result.loadTime - bestCDN.loadTime) / r2Result.loadTime * 100).toFixed(1)}%`);
    
    console.log('\n📝 Для использования добавьте в src/data/exercises.js:');
    console.log(`   const R2_CDN_URL = "${bestCDN.url}";`);
  } else {
    console.log('⚠️  Ни один CDN не работает');
    console.log('💡 Нужно настроить Custom Domain в Cloudflare Dashboard');
  }
}

testAllCDNCandidates().catch(console.error);


