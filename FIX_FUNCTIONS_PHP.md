# Как правильно добавить код в functions.php

## Проблема
Ошибка "unexpected token '<', expecting end of file" обычно возникает, если:
1. Код вставлен после закрывающего тега `?>` 
2. Код содержит лишние теги PHP
3. Код вставлен неправильно

## Решение

### Шаг 1: Откройте functions.php

В файловом менеджере Beget найдите:
```
wp-content/themes/astra/functions.php
```

### Шаг 2: Проверьте конец файла

В конце файла НЕ должно быть закрывающего тега `?>`

Если есть строка:
```php
?>
```
**УДАЛИТЕ ЕЁ!** В WordPress functions.php не должно быть закрывающего тега.

### Шаг 3: Добавьте код

В самом конце файла (после всего остального кода, БЕЗ пустых строк в начале) добавьте:

```php
// Обработчик подписок Юкассы
function handle_yookassa_subscription($payment_data) {
    $metadata = $payment_data['metadata'] ?? [];
    $userId = $metadata['user_id'] ?? null;
    $subscriptionType = $metadata['subscription_type'] ?? null;
    
    if (!$userId || !$subscriptionType) {
        return false;
    }
    
    $paymentId = $payment_data['id'] ?? null;
    $amount = $payment_data['amount']['value'] ?? 0;
    
    if (!$paymentId) {
        error_log('YooKassa Subscription: Missing payment ID');
        return false;
    }
    
    $subscriptionEndDate = new DateTime();
    switch ($subscriptionType) {
        case 'monthly':
            $subscriptionEndDate->modify('+1 month');
            break;
        case '3months':
            $subscriptionEndDate->modify('+3 months');
            break;
        case 'yearly':
            $subscriptionEndDate->modify('+1 year');
            break;
        default:
            $subscriptionEndDate->modify('+1 month');
    }
    
    $updateData = array(
        'userId' => $userId,
        'subscription' => array(
            'active' => true,
            'type' => $subscriptionType,
            'startDate' => date('c'),
            'endDate' => $subscriptionEndDate->format('c'),
            'paymentId' => $paymentId,
            'amount' => $amount
        )
    );
    
    $webhookSecret = '1fddaef9da810cd310872383c3d27a05a2c97618ea94f358f3178e1ad23702c5';
    $nextjsApiUrl = 'https://pure-progression.com/api/subscription/update';
    
    $ch = curl_init($nextjsApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'X-Webhook-Secret: ' . $webhookSecret
    ));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        error_log("YooKassa Subscription: Updated successfully for user $userId");
        return true;
    } else {
        error_log("YooKassa Subscription: Failed to update. HTTP Code: $httpCode, Response: $response");
        return false;
    }
}

add_action('woocommerce_api_yookassa_callback', 'process_yookassa_subscription_webhook', 5);

function process_yookassa_subscription_webhook() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['event'])) {
        return;
    }
    
    if ($data['event'] !== 'payment.succeeded') {
        return;
    }
    
    $payment = isset($data['object']) ? $data['object'] : null;
    if (!$payment) {
        return;
    }
    
    $metadata = isset($payment['metadata']) ? $payment['metadata'] : array();
    $userId = isset($metadata['user_id']) ? $metadata['user_id'] : null;
    
    if ($userId) {
        handle_yookassa_subscription($payment);
    }
}
```

### Шаг 4: Сохраните файл

Убедитесь, что:
- ✅ В конце файла НЕТ закрывающего тега `?>`
- ✅ Код добавлен в самый конец
- ✅ Нет лишних пустых строк в начале кода

## Альтернативный способ (если не работает)

Если через редактор не получается, используйте файловый менеджер Beget:

1. Скачайте файл `functions.php` на компьютер
2. Откройте в текстовом редакторе (Notepad++, VS Code и т.д.)
3. Добавьте код в конец
4. Убедитесь, что нет `?>` в конце
5. Загрузите обратно на сервер

## Проверка

После сохранения:
1. Сайт должен работать нормально (не должно быть белого экрана)
2. В логах WordPress не должно быть ошибок
3. Можно протестировать подписку

