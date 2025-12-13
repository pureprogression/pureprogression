# Резервная копия цен на подписки

## Текущие цены (до изменения для теста):

- **Месячная подписка (monthly):** 990 ₽
- **Подписка на 3 месяца (3months):** 2490 ₽ (830 ₽/мес, экономия 16%)
- **Годовая подписка (yearly):** 8290 ₽ (691 ₽/мес, экономия 30%)

## Файлы, где используются цены:

1. `src/app/subscribe/page.js` - SUBSCRIPTION_PLANS
2. `src/lib/payments.js` - SUBSCRIPTION_PRICES
3. `src/app/admin/subscriptions/page.js` - handleActivateSubscription
4. `src/app/api/subscription/manual-activate/route.js` - subscriptionData.amount
5. `src/components/landing/PricingSection.js` - SUBSCRIPTION_PLANS

## Для восстановления цен:

Вернуть значения:
- monthly: 990
- 3months: 2490
- yearly: 8290

