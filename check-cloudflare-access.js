/**
 * Проверка доступности Cloudflare API и R2
 * Запуск: node check-cloudflare-access.js
 */

const https = require('https');

async function checkCloudflareAPI() {
  console.log('🔍 Проверка доступности Cloudflare...\n');
  
  // Проверяем Cloudflare API
  const apiCheck = new Promise((resolve) => {
    const req = https.get('https://api.cloudflare.com/client/v4/zones', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (res) => {
      resolve({
        status: res.statusCode,
        accessible: res.statusCode === 200 || res.statusCode === 401 // 401 = API работает, нужна авторизация
      });
    });
    
    req.on('error', () => {
      resolve({ status: 'ERROR', accessible: false });
    });
    
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', accessible: false });
    });
  });
  
  const result = await apiCheck;
  
  if (result.accessible) {
    console.log('✅ Cloudflare API доступен');
    console.log('🌐 Готов к настройке CDN через Dashboard');
  } else {
    console.log('❌ Cloudflare API недоступен');
    console.log('💡 Проверьте интернет-соединение');
  }
  
  console.log('\n📋 Следующие шаги:');
  console.log('1. Открыть: https://dash.cloudflare.com/');
  console.log('2. Войти в аккаунт Cloudflare');
  console.log('3. Перейти в R2 Object Storage');
  console.log('4. Настроить Custom Domain для CDN');
  
  return result.accessible;
}

checkCloudflareAPI().catch(console.error);







