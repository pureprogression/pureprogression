# Отладка подписки

## Проблема
Подписка не отображается, хотя оплата прошла.

## Что проверить:

### 1. Проверьте структуру данных в Firebase

В Firebase Console:
1. Firestore Database → коллекция `users`
2. Найдите документ с вашим userId (не email!)
3. Проверьте, есть ли поле `subscription`

**Важно:** userId - это не email, а UID из Firebase Auth!

### 2. Как найти свой userId:

1. Откройте консоль браузера (F12)
2. Введите:
```javascript
firebase.auth().currentUser?.uid
```
Или:
```javascript
import { auth } from '@/lib/firebase';
console.log(auth.currentUser?.uid);
```

### 3. Проверьте webhook

Проверьте логи на WordPress сервере:
- Файл: `/public_html/api/yookassa-webhook.log`
- Или логи ошибок WordPress

### 4. Временное решение - создать подписку вручную

Можно создать тестовую подписку через Firebase Console:
1. Найдите документ пользователя в коллекции `users`
2. Добавьте поле `subscription`:
```json
{
  "active": true,
  "type": "monthly",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-02-01T00:00:00Z",
  "paymentId": "test_payment",
  "amount": 1
}
```

Но лучше использовать Timestamp для дат.

