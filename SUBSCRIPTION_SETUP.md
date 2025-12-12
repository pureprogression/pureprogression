# Инструкция по настройке подписки через Юкассу

## Архитектура решения

1. **Страница оплаты**: `pure-progression.com/subscribe` (Next.js)
2. **Webhook**: `pure-progression.ru/api/yookassa-webhook.php` (PHP на WordPress)
3. **API обновления подписки**: `pure-progression.com/api/subscription/update` (Next.js)
4. **Проверка подписки**: Автоматически через хук `useSubscription`

## Шаг 1: Настройка переменных окружения

Добавьте в `.env.local`:

```env
# Юкасса (уже должны быть настроены)
NEXT_PUBLIC_YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# Секретный ключ для webhook (придумайте сложный ключ)
WEBHOOK_SECRET=your_random_secret_key_here_min_32_chars

# URL вашего сайта
NEXT_PUBLIC_SITE_URL=https://pure-progression.com
```

## Шаг 2: Установка PHP файла на WordPress

1. Скопируйте файл `yookassa-webhook.php` на ваш сервер Beget
2. Разместите его в одном из мест:
   - В корне сайта: `/public_html/yookassa-webhook.php`
   - Или в папке API: `/public_html/api/yookassa-webhook.php`

3. Отредактируйте файл `yookassa-webhook.php`:
   - Замените `your-firebase-project-id` на ваш Firebase Project ID
   - Замените `your-firebase-private-key` на ваш Firebase Private Key (если используете прямой доступ)
   - Замените `your-firebase-client-email` на ваш Firebase Client Email
   - Или оставьте как есть, если используете HTTP запрос к Next.js API

4. Установите права доступа на файл (644 или 755)

## Шаг 3: Настройка webhook в личном кабинете Юкассы

1. Войдите в личный кабинет Юкассы
2. Перейдите в раздел "Настройки" → "Уведомления"
3. Добавьте URL webhook:
   ```
   https://pure-progression.ru/api/yookassa-webhook.php
   ```
   или
   ```
   https://pure-progression.ru/yookassa-webhook.php
   ```
   (в зависимости от того, куда вы разместили файл)

4. Выберите события для отправки:
   - `payment.succeeded` (обязательно)

## Шаг 4: Настройка цен подписки

Отредактируйте файл `src/app/subscribe/page.js`:

```javascript
const SUBSCRIPTION_PLANS = {
  monthly: {
    price: 990, // Ваша цена за месяц
    // ...
  },
  '3months': {
    price: 2490, // Ваша цена за 3 месяца
    // ...
  },
  yearly: {
    price: 8990, // Ваша цена за год
    // ...
  }
};
```

Также обновите цены в `src/lib/payments.js` в функции `createSubscription`.

## Шаг 5: Настройка Firebase

Убедитесь, что в Firebase:
1. Создана коллекция `users` (если еще нет)
2. В правилах безопасности Firestore разрешена запись для аутентифицированных пользователей

Пример правил Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Шаг 6: Тестирование

### Тестовый режим:
1. Используйте тестовые ключи Юкассы
2. Создайте тестовый платеж
3. Проверьте, что webhook получает данные (смотрите логи в `yookassa-webhook.log`)
4. Проверьте, что подписка обновляется в Firebase

### Проверка работы:
1. Зайдите на `pure-progression.com/subscribe`
2. Выберите план и нажмите "Оформить подписку"
3. Оплатите через тестовую карту Юкассы
4. После оплаты вы должны быть перенаправлены на `pure-progression.com/payment/success`
5. Проверьте, что подписка активна в Firebase
6. Попробуйте зайти на `/workout-builder` или `/my-workouts` - должен быть доступ

## Структура данных подписки в Firebase

В коллекции `users/{userId}` будет поле `subscription`:

```javascript
{
  subscription: {
    active: true,
    type: 'monthly', // 'monthly', '3months', 'yearly'
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-02-01T00:00:00Z',
    paymentId: 'payment_id_from_yookassa',
    amount: 990,
    updatedAt: Timestamp
  }
}
```

## Возможные проблемы и решения

### Проблема: Webhook не получает данные
**Решение:**
- Проверьте, что файл доступен по URL
- Проверьте права доступа на файл
- Проверьте логи в `yookassa-webhook.log`

### Проблема: Подписка не обновляется в Firebase
**Решение:**
- Проверьте, что `WEBHOOK_SECRET` совпадает в PHP файле и `.env.local`
- Проверьте логи PHP файла
- Проверьте, что API endpoint `/api/subscription/update` доступен

### Проблема: Страницы все еще заблокированы после оплаты
**Решение:**
- Проверьте, что подписка обновлена в Firebase
- Проверьте дату окончания подписки (должна быть в будущем)
- Обновите страницу (подписка проверяется в реальном времени)

## Безопасность

1. **WEBHOOK_SECRET**: Используйте сложный случайный ключ минимум 32 символа
2. **Права доступа**: Убедитесь, что PHP файл не доступен для чтения посторонним
3. **Firebase Rules**: Настройте правила безопасности для коллекции `users`
4. **HTTPS**: Используйте только HTTPS для webhook URL

## Дополнительные настройки

### Логирование
Логи webhook сохраняются в файл `yookassa-webhook.log` в той же директории, где находится PHP файл.

### Уведомления пользователю
Можно добавить отправку email уведомлений после успешной оплаты через Firebase Cloud Functions или через PHP.

### Автопродление
Для автопродления подписки нужно использовать подписки Юкассы (recurring payments), что требует дополнительной настройки.

