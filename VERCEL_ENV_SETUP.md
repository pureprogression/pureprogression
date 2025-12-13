# Настройка переменных окружения на Vercel

## Проблема: "Payment configuration missing"

Эта ошибка возникает, когда не настроены переменные окружения для YooKassa на Vercel.

## Решение: Добавить переменные окружения

### Шаг 1: Откройте настройки проекта на Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Выберите проект `purep-web` (или ваш проект)
3. Перейдите в **Settings** → **Environment Variables**

### Шаг 2: Добавьте следующие переменные

#### Обязательные переменные:

1. **`NEXT_PUBLIC_YOOKASSA_SHOP_ID`**
   - Значение: Ваш Shop ID из личного кабинета YooKassa
   - Environment: Production, Preview, Development (все три)
   - Пример: `123456`

2. **`YOOKASSA_SECRET_KEY`**
   - Значение: Ваш Secret Key из личного кабинета YooKassa
   - Environment: Production, Preview, Development (все три)
   - ⚠️ **Важно:** Это секретный ключ, НЕ добавляйте `NEXT_PUBLIC_` в начало!
   - Пример: `live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

3. **`WEBHOOK_SECRET`** (опционально, но рекомендуется)
   - Значение: Секретная строка для защиты webhook
   - Должен совпадать с `$webhookSecret` в PHP файле на WordPress
   - Environment: Production, Preview, Development (все три)
   - Пример: `1fddaef9da810cd310872383c3d27a05a2c97618ea94f358f3178e1ad23702c5`

### Шаг 3: Перезапустите деплой

После добавления переменных:
1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **Redeploy** (три точки → Redeploy)

Или просто сделайте новый коммит и пуш - Vercel автоматически пересоберет проект.

## Где взять ключи YooKassa?

1. Зайдите в [личный кабинет YooKassa](https://yookassa.ru/my)
2. Перейдите в **Настройки** → **Ключи API**
3. Скопируйте:
   - **Shop ID** → это `NEXT_PUBLIC_YOOKASSA_SHOP_ID`
   - **Secret Key** → это `YOOKASSA_SECRET_KEY`

⚠️ **Важно:** Используйте **продакшен** ключи, не тестовые!

## Проверка

После настройки переменных и перезапуска деплоя:
1. Попробуйте оформить подписку
2. Ошибка "Payment configuration missing" должна исчезнуть
3. Должна открыться страница оплаты YooKassa

## Если ошибка осталась

1. Проверьте, что переменные добавлены для всех окружений (Production, Preview, Development)
2. Убедитесь, что после добавления переменных был перезапущен деплой
3. Проверьте логи деплоя на Vercel - там может быть более детальная информация об ошибке

