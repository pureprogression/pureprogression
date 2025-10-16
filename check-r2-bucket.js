/**
 * Проверка доступности R2 bucket и его содержимого
 * Запуск: node check-r2-bucket.js
 */

const https = require('https');

const R2_BUCKET = "pub-24028780ba564e299106a5335d66f54c.r2.dev";
const TEST_FILES = [
  '/videos/webHero.mp4',
  '/videos/x92.mp4',
  '/posters/webHero.jpg',
  '/posters/x92.jpg'
];

function checkFile(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length'],
        accessible: res.statusCode === 200
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        error: error.message,
        accessible: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        error: 'Request timeout',
        accessible: false
      });
    });
  });
}

async function checkR2Bucket() {
  console.log('🔍 Проверка доступности R2 bucket...\n');
  console.log(`📦 Bucket: ${R2_BUCKET}\n`);
  
  const results = [];
  
  for (const file of TEST_FILES) {
    const url = `https://${R2_BUCKET}${file}`;
    console.log(`📁 Проверяю: ${file}`);
    
    const result = await checkFile(url);
    results.push(result);
    
    if (result.accessible) {
      const size = result.contentLength ? (parseInt(result.contentLength) / 1024 / 1024).toFixed(2) + 'MB' : 'unknown';
      console.log(`   ✅ Доступен (${result.status}) - ${size}`);
    } else {
      console.log(`   ❌ Недоступен (${result.status}) - ${result.error || 'Unknown error'}`);
    }
    console.log();
  }
  
  // Статистика
  const accessible = results.filter(r => r.accessible).length;
  const total = results.length;
  
  console.log(`📊 Результат: ${accessible}/${total} файлов доступны`);
  
  if (accessible === total) {
    console.log('🎉 R2 bucket полностью доступен!');
    console.log('✅ Готов для настройки CDN');
  } else if (accessible > 0) {
    console.log('⚠️  R2 bucket частично доступен');
    console.log('💡 Проверьте настройки публичного доступа');
  } else {
    console.log('❌ R2 bucket недоступен');
    console.log('💡 Нужно настроить публичный доступ в Cloudflare Dashboard');
  }
  
  console.log('\n📋 Следующие шаги:');
  console.log('1. Зайти в Cloudflare Dashboard → R2 Object Storage');
  console.log('2. Выбрать bucket и проверить Public Access');
  console.log('3. Настроить Custom Domain для CDN');
}

checkR2Bucket().catch(console.error);


