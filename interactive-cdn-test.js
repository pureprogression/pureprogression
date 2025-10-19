/**
 * Интерактивный тест CDN с выбором домена
 * Запуск: node interactive-cdn-test.js
 */

const https = require('https');
const readline = require('readline');

const R2_URL = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
const TEST_VIDEO = "/videos/webHero.mp4";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
            'server': res.headers['server']
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
    
    req.setTimeout(5000, () => {
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

async function testR2Baseline() {
  console.log('📊 Тестирование R2 (базовая линия)...');
  const result = await testCDN(R2_URL);
  
  if (result.working) {
    console.log(`   ⏱️  Время: ${result.loadTime}ms`);
    console.log(`   🏃 Скорость: ${result.speed.toFixed(2)}MB/s`);
    console.log(`   📦 Размер: ${(result.dataSize / 1024 / 1024).toFixed(2)}MB\n`);
    return result;
  } else {
    console.log(`   ❌ R2 недоступен: ${result.error}\n`);
    return null;
  }
}

async function testCustomCDN(cdnUrl) {
  console.log(`🌍 Тестирование CDN: ${cdnUrl}`);
  const result = await testCDN(cdnUrl);
  
  if (result.working) {
    console.log(`   ✅ Работает! (${result.status})`);
    console.log(`   ⏱️  Время: ${result.loadTime}ms`);
    console.log(`   🏃 Скорость: ${result.speed.toFixed(2)}MB/s`);
    
    if (result.headers['cf-cache-status']) {
      console.log(`   🗄️  Кеш: ${result.headers['cf-cache-status']}`);
    }
    if (result.headers['cf-ray']) {
      console.log(`   🌐 CF-Ray: ${result.headers['cf-ray']}`);
    }
    
    return result;
  } else {
    console.log(`   ❌ Не работает (${result.status})`);
    if (result.error) {
      console.log(`   💡 ${result.error}`);
    }
    return null;
  }
}

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🚀 Интерактивный тест CDN\n');
  
  // Тестируем R2 для сравнения
  const r2Result = await testR2Baseline();
  
  if (!r2Result) {
    console.log('❌ R2 недоступен. Проверьте интернет-соединение.');
    rl.close();
    return;
  }
  
  // Спрашиваем CDN URL
  const cdnUrl = await askQuestion('🌍 Введите CDN URL для тестирования (например: https://cdn.pureprogression.com): ');
  
  if (!cdnUrl) {
    console.log('❌ CDN URL не указан.');
    rl.close();
    return;
  }
  
  console.log();
  
  // Тестируем CDN
  const cdnResult = await testCustomCDN(cdnUrl);
  
  if (cdnResult) {
    const improvement = ((r2Result.loadTime - cdnResult.loadTime) / r2Result.loadTime * 100).toFixed(1);
    const speedImprovement = ((cdnResult.speed - r2Result.speed) / r2Result.speed * 100).toFixed(1);
    
    console.log('\n📈 Сравнение результатов:');
    console.log(`   ⚡ Ускорение загрузки: ${improvement}%`);
    console.log(`   🚀 Увеличение скорости: ${speedImprovement}%`);
    
    if (parseFloat(improvement) > 0) {
      console.log('   🎉 CDN работает быстрее!');
      console.log('\n📝 Для использования добавьте в src/data/exercises.js:');
      console.log(`   const R2_CDN_URL = "${cdnUrl}";`);
    } else {
      console.log('   ⚠️  CDN медленнее или не настроен');
    }
  } else {
    console.log('\n💡 CDN не работает. Возможные причины:');
    console.log('   1. Custom Domain не настроен в Cloudflare');
    console.log('   2. DNS еще не распространился (подождите 5-10 минут)');
    console.log('   3. Неправильный URL домена');
  }
  
  rl.close();
}

main().catch(console.error);




