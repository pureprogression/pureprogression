# 🚀 НАСТРОЙКА CLOUDFLARE CDN ДЛЯ R2 BUCKET

## 📋 Чек-лист действий:

### 1. ✅ Войти в Cloudflare Dashboard
- Перейти на [dash.cloudflare.com](https://dash.cloudflare.com/)
- Авторизоваться

### 2. ✅ Перейти в R2 Object Storage
- В верхнем меню выбрать **"R2"**
- Найти ваш bucket (где хранятся видео)

### 3. ✅ Настроить публичный доступ
- Перейти во вкладку **"Settings"**
- В разделе **"Public access"** убедиться что bucket доступен публично

### 4. ✅ Добавить Custom Domain
- В разделе **"Custom Domains"** нажать **"Connect Domain"**
- Ввести домен: `cdn.pureprogression.com`
- Нажать **"Continue"**
- Подтвердить DNS запись: **"Connect Domain"**

### 5. ✅ Настроить кеширование
- Перейти в **"Caching"** → **"Configuration"**
- Создать Page Rules:
  ```
  URL: cdn.pureprogression.com/videos/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
  Browser Cache TTL: 1 week
  ```

### 6. ✅ Включить оптимизации
- **Speed** → **Optimization**:
  - ✅ Auto Minify
  - ✅ Brotli
  - ✅ HTTP/2
  - ✅ HTTP/3

## 🎯 Ожидаемый результат:
- **Текущая скорость**: 532ms
- **После CDN**: ~200-300ms (**+50% ускорение!**)
- **Географическое распределение**: 200+ датацентров
- **Кеширование**: автоматическое на периферии


