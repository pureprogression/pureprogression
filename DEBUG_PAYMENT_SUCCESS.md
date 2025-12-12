# Отладка активации подписки после оплаты

## Проблема
Оплата прошла, но подписка не активировалась автоматически.

## Что проверить:

### 1. Проверьте консоль браузера

После оплаты откройте консоль (F12 → Console) и посмотрите логи:

**Должны быть записи:**
- `Payment Success Page - URL params: ...`
- `Got payment ID from localStorage: ...` (если payment_id сохранен)
- `Found payment ID: ...`
- `Checking payment status for: ...`
- `Payment succeeded, getting full payment info...`
- `Attempting to activate subscription...`
- `✅ Subscription activated successfully!`

**Если видите ошибки:**
- `❌ Failed to activate: ...` - пришлите текст ошибки
- `Error activating subscription: ...` - пришлите текст ошибки

### 2. Проверьте localStorage

В консоли браузера введите:
```javascript
console.log({
  paymentId: localStorage.getItem('last_subscription_payment_id'),
  type: localStorage.getItem('last_subscription_type'),
  userId: localStorage.getItem('last_subscription_user_id')
});
```

### 3. Проверьте, что payment_id сохраняется

При создании платежа (на странице `/subscribe`) payment_id должен сохраниться в localStorage.

### 4. Ручная активация (временное решение)

Если автоматическая активация не работает, можно использовать кнопку "Create Test Subscription" в профиле после каждой оплаты.

## Что я добавил:

1. ✅ Сохранение payment_id в localStorage при создании платежа
2. ✅ Использование payment_id из localStorage на странице success
3. ✅ Альтернативный способ активации, если payment_id не найден
4. ✅ Подробное логирование в консоль

## Следующие шаги:

1. Откройте консоль браузера (F12)
2. Сделайте новую оплату
3. Посмотрите логи в консоли
4. Пришлите мне логи - я помогу разобраться

