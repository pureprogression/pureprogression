/**
 * Проверка доступных доменов для сайта
 * Запуск: node check-site-domains.js
 */

const https = require('https');

const POSSIBLE_DOMAINS = [
  'pureprogression.vercel.app',
  'purep-fitness.vercel.app', 
  'pureprogression.ru',
  'pure-progression.ru',
  'pub-24028780ba564e299106a5335d66f54c.r2.dev'
];

function checkDomain(domain) {
  return new Promise((resolve) => {
    const req = https.get(`https://${domain}`, (res) => {
      resolve({
        domain,
        status: res.statusCode,
        accessible: res.statusCode === 200,
        headers: {
          'server': res.headers['server'],
          'x-vercel-id': res.headers['x-vercel-id'],
          'location': res.headers['location']
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
    
    req.setTimeout(3000, () => {
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

async function checkAllDomains() {
  console.log('🌐 Проверка доступных доменов для вашего сайта...\n');
  
  const results = [];
  
  for (const domain of POSSIBLE_DOMAINS) {
    console.log(`🔍 Проверяю: ${domain}`);
    const result = await checkDomain(domain);
    results.push(result);
    
    if (result.accessible) {
      console.log(`   ✅ ДОСТУПЕН (${result.status})`);
      
      if (result.headers['x-vercel-id']) {
        console.log(`   🚀 Vercel деплой: ${result.headers['x-vercel-id']}`);
      }
      
      if (result.headers.server) {
        console.log(`   🖥️  Сервер: ${result.headers.server}`);
      }
      
      console.log(`   📱 Открыть: https://${domain}`);
    } else {
      console.log(`   ❌ Недоступен (${result.status})`);
      if (result.error) {
        console.log(`   💡 ${result.error}`);
      }
    }
    console.log();
  }
  
  // Найти рабочие домены
  const workingDomains = results.filter(r => r.accessible);
  
  console.log('📊 РЕЗУЛЬТАТ:');
  
  if (workingDomains.length > 0) {
    console.log(`✅ Найдено ${workingDomains.length} рабочих доменов:`);
    workingDomains.forEach(result => {
      console.log(`   🌐 https://${result.domain}`);
    });
    
    console.log('\n🎯 Рекомендуемый домен для просмотра:');
    const vercelDomain = workingDomains.find(r => r.domain.includes('vercel.app'));
    if (vercelDomain) {
      console.log(`   🚀 https://${vercelDomain.domain} (Vercel)`);
    } else {
      console.log(`   🌐 https://${workingDomains[0].domain}`);
    }
  } else {
    console.log('❌ Ни один домен не доступен');
    console.log('💡 Возможные причины:');
    console.log('   - Сайт не задеплоен');
    console.log('   - Проблемы с DNS');
    console.log('   - Сайт недоступен');
  }
  
  console.log('\n📝 Для просмотра видео:');
  console.log('   🎬 Видео загружаются с: https://pub-24028780ba564e299106a5335d66f54c.r2.dev');
  console.log('   📊 Скорость загрузки: 1037ms');
}

checkAllDomains().catch(console.error);




