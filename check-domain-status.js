/**
 * Проверка статуса доменов pureprogression.com и pureprogression.ru
 * Запуск: node check-domain-status.js
 */

const https = require('https');

async function checkDomain(domain) {
  return new Promise((resolve) => {
    const req = https.get(`https://${domain}`, (res) => {
      resolve({
        domain,
        status: res.statusCode,
        accessible: res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302,
        headers: {
          'server': res.headers['server'],
          'location': res.headers['location'],
          'x-powered-by': res.headers['x-powered-by']
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        domain,
        status: 'ERROR',
        error: error.message,
        accessible: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        domain,
        status: 'TIMEOUT',
        error: 'Request timeout',
        accessible: false
      });
    });
  });
}

async function checkBothDomains() {
  console.log('🔍 Проверка статуса доменов...\n');
  
  const domains = ['pureprogression.com', 'pureprogression.ru'];
  const results = [];
  
  for (const domain of domains) {
    console.log(`🌐 Проверяю: ${domain}`);
    const result = await checkDomain(domain);
    results.push(result);
    
    if (result.accessible) {
      console.log(`   ✅ Доступен (${result.status})`);
      if (result.headers.server) {
        console.log(`   🖥️  Сервер: ${result.headers.server}`);
      }
      if (result.headers.location) {
        console.log(`   🔄 Редирект: ${result.headers.location}`);
      }
    } else {
      console.log(`   ❌ Недоступен (${result.status})`);
      if (result.error) {
        console.log(`   💡 ${result.error}`);
      }
    }
    console.log();
  }
  
  // Анализ результатов
  console.log('📊 Анализ ситуации:');
  
  const comResult = results.find(r => r.domain === 'pureprogression.com');
  const ruResult = results.find(r => r.domain === 'pureprogression.ru');
  
  if (comResult.accessible) {
    console.log('✅ pureprogression.com - работает');
    console.log('   💡 Возможно, домен все еще ваш, но не в Cloudflare');
  } else {
    console.log('❌ pureprogression.com - не работает');
    console.log('   💡 Домен может быть не продлен или не ваш');
  }
  
  if (ruResult.accessible) {
    console.log('✅ pureprogression.ru - работает');
    console.log('   💡 На нем висит старый сайт');
  } else {
    console.log('❌ pureprogression.ru - не работает');
    console.log('   💡 Проверьте настройки DNS');
  }
  
  console.log('\n🎯 Рекомендации:');
  
  if (comResult.accessible) {
    console.log('1. Проверить владение pureprogression.com через регистратора');
    console.log('2. Если домен ваш - добавить в Cloudflare');
    console.log('3. Настроить CDN: cdn.pureprogression.com');
  } else if (ruResult.accessible) {
    console.log('1. Использовать pureprogression.ru для CDN');
    console.log('2. Добавить домен в Cloudflare');
    console.log('3. Настроить CDN: cdn.pureprogression.ru');
  } else {
    console.log('1. Зарегистрировать новый домен');
    console.log('2. Или использовать R2.dev домен временно');
  }
}

checkBothDomains().catch(console.error);


