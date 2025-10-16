# 🌐 НАСТРОЙКА ДОМЕНА pureprogression.com В CLOUDFLARE

## 🎯 ЦЕЛЬ:
Добавить домен `pureprogression.com` в Cloudflare и настроить CDN для R2

---

## 📋 ПОШАГОВЫЙ ПЛАН:

### **ШАГ 1: Добавить домен в Cloudflare**

1. **В Cloudflare Dashboard:**
   - Перейти в **"Websites"** (главное меню слева)
   - Нажать **"Add a Site"**

2. **Ввести домен:**
   ```
   pureprogression.com
   ```

3. **Выбрать план:**
   - ✅ **Free** (достаточно для CDN)

4. **Добавить DNS записи:**
   - Cloudflare предложит автоматически
   - Подтвердить добавление

### **ШАГ 2: Настроить DNS записи**

После добавления домена добавить записи:

```
Type: A
Name: @
IPv4 address: 192.0.2.1
Proxy status: ❌ DNS only (серое облако)

Type: CNAME
Name: cdn
Target: r2.dev
Proxy status: ✅ Proxied (оранжевое облако)
```

### **ШАГ 3: Настроить R2 Custom Domain**

1. **Перейти в R2** → ваш bucket
2. **Custom Domains** → **"Connect Domain"**
3. **Ввести:** `cdn.pureprogression.com`
4. **Нажать "Continue"** → **"Connect Domain"**

### **ШАГ 4: Настроить кеширование**

1. **Перейти в "Caching"** → **"Configuration"**
2. **Создать Page Rule:**
   ```
   URL: cdn.pureprogression.com/videos/*
   Cache Level: Cache Everything
   Edge Cache TTL: 1 month
   Browser Cache TTL: 1 week
   ```

---

## ⏱️ ВРЕМЯ: 10-15 минут

## 🎉 РЕЗУЛЬТАТ:
- ✅ Домен `pureprogression.com` в Cloudflare
- ✅ CDN `cdn.pureprogression.com` для R2
- ✅ Автоматическое кеширование видео
- ✅ +40-60% ускорение загрузки

---

## 📞 ЕСЛИ ВОЗНИКЛИ ПРОБЛЕМЫ:

### **Домен уже занят:**
- Проверить кто владеет доменом
- Рассмотреть альтернативы: `pureprogression.net`, `pureprogression.app`

### **DNS не работает:**
- Подождать 5-10 минут для распространения
- Проверить настройки DNS в Cloudflare

### **Custom Domain не подключается:**
- Убедиться что DNS записи созданы
- Проверить что домен подключен к Cloudflare

---

## 🚀 ГОТОВЫ НАЧИНАТЬ?

**Начинаем с добавления домена в Cloudflare?** 🌐


