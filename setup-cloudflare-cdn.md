# 🚀 Настройка Cloudflare CDN для максимальной скорости

## 1. Подключение Cloudflare CDN к R2

### В панели Cloudflare:
1. **R2 Object Storage** → ваш bucket → **Settings** → **Public Access**
2. **Custom Domains** → **Connect Domain**
3. Создайте поддомен: `cdn.pureprogression.com` или `assets.pureprogression.com`

### Настройка DNS:
```
Type: CNAME
Name: cdn (или assets)
Target: r2.dev (автоматически)
Proxy status: ✅ Proxied (оранжевое облако)
```

## 2. Оптимизация кеширования

### Page Rules для видео:
```
URL: cdn.pureprogression.com/videos/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month
Browser Cache TTL: 1 week
```

### Page Rules для постеров:
```
URL: cdn.pureprogression.com/posters/*
Cache Level: Cache Everything  
Edge Cache TTL: 1 week
Browser Cache TTL: 1 day
```

## 3. Включение сжатия

### Speed → Optimization:
- ✅ **Auto Minify**: HTML, CSS, JS
- ✅ **Brotli**: включить
- ✅ **HTTP/2**: включить
- ✅ **HTTP/3**: включить

## 4. Обновление URL в коде

После настройки CDN замените в `src/data/exercises.js`:

```javascript
// Было:
const R2_CDN_URL = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";

// Станет:
const R2_CDN_URL = "https://cdn.pureprogression.com";
```

## 5. Ожидаемый результат

- ⚡ **Скорость загрузки**: +40-60%
- 🌍 **Географическое распределение**: видео кешируются на 200+ датацентрах
- 💰 **Экономия трафика**: меньше нагрузки на R2
- 📱 **Мобильная скорость**: оптимизация для медленных соединений

## 6. Мониторинг

### Cloudflare Analytics:
- **Caching**: процент кеш-попаданий
- **Performance**: Core Web Vitals
- **Security**: защита от DDoS

### Проверка скорости:
```bash
# Тест скорости CDN
curl -w "@curl-format.txt" -o /dev/null -s "https://cdn.pureprogression.com/videos/webHero.mp4"

# curl-format.txt:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n
```


