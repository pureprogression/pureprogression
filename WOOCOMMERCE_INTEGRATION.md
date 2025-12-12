# Интеграция подписок с существующим WooCommerce webhook

## Проблема
У вас уже настроен webhook для WooCommerce:
- URL: `https://pure-progression.ru/?yookassa=callback`
- Если заменить URL, WooCommerce перестанет работать

## Решение: Использовать тот же webhook, добавить обработку подписок

### Вариант 1: Добавить код в functions.php темы WordPress (РЕКОМЕНДУЕТСЯ)

1. Войдите в админ-панель WordPress
2. Перейдите: **Внешний вид** → **Редактор тем** → **functions.php**
3. Добавьте в конец файла код из `yookassa-subscription-handler.php`
4. Сохраните

**Или через файловый менеджер Beget:**
1. Найдите файл `wp-content/themes/ваша-тема/functions.php`
2. Добавьте код в конец файла
3. Сохраните

### Вариант 2: Создать отдельный плагин (если не хотите менять тему)

1. Создайте файл `wp-content/plugins/yookassa-subscription-handler.php`
2. Скопируйте код из `yookassa-subscription-handler.php`
3. Активируйте плагин в WordPress

## Как это работает:

1. Юкасса отправляет webhook на существующий URL: `https://pure-progression.ru/?yookassa=callback`
2. WordPress/WooCommerce получает webhook
3. Наш код проверяет: если в `metadata` есть `user_id` и `subscription_type` → это подписка
4. Если подписка → обновляем через Next.js API
5. Если нет → WooCommerce обрабатывает как обычно

## Преимущества:

✅ Не нужно менять настройки в Юкассе  
✅ WooCommerce продолжает работать  
✅ Подписки обрабатываются автоматически  
✅ Один webhook для обоих типов платежей  

## Важно:

- В Юкассе **НЕ МЕНЯЙТЕ** URL webhook, оставьте как есть
- Код автоматически определит тип платежа по metadata
- WooCommerce платежи будут работать как раньше
- Подписки будут обрабатываться отдельно

## Настройка:

В файле `yookassa-subscription-handler.php` (или в functions.php) проверьте:

```php
$webhookSecret = '1fddaef9da810cd310872383c3d27a05a2c97618ea94f358f3178e1ad23702c5';
```

Должен совпадать с `WEBHOOK_SECRET` в `.env.local` вашего Next.js проекта.

## Тестирование:

1. Оформите подписку на `pure-progression.com/subscribe`
2. Оплатите тестовой картой
3. Проверьте логи WordPress (если включены)
4. Проверьте, что подписка обновилась в Firebase

