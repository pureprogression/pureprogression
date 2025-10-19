# Настройка платежей

## Переменные окружения

Создайте файл `.env.local` в корне проекта со следующими переменными:

```env
# ЮKassa (для России и СНГ)
NEXT_PUBLIC_YOOKASSA_SHOP_ID=your_shop_id_here
NEXT_PUBLIC_YOOKASSA_SECRET_KEY=your_secret_key_here

# Stripe (для международных платежей)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Для продакшена нужно будет добавить серверные ключи
YOOKASSA_SECRET_KEY=your_server_secret_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
```

## Настройка ЮKassы

1. Зайдите в личный кабинет ЮKassы
2. Найдите раздел "Настройки" → "Сайты"
3. Добавьте новый сайт с доменом `pure-progression.com`
4. Скопируйте:
   - **Shop ID** (идентификатор магазина)
   - **Secret Key** (секретный ключ)

## Настройка Stripe

1. Зарегистрируйтесь на [stripe.com](https://stripe.com)
2. Получите ключи в разделе "Developers" → "API keys"
3. Скопируйте:
   - **Publishable key** (публичный ключ)
   - **Secret key** (секретный ключ) - только для сервера

## Следующие шаги

1. Добавить реальную интеграцию с ЮKassой
2. Добавить реальную интеграцию со Stripe
3. Создать API endpoints для обработки платежей
4. Добавить вебхуки для уведомлений о статусе платежей
