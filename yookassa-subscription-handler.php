<?php
/**
 * Обработчик подписок для существующего WooCommerce webhook
 * Этот файл можно добавить в functions.php вашей темы WordPress
 * Или вызвать из существующего WooCommerce callback
 * 
 * Использование: Добавьте этот код в functions.php темы WordPress
 * или создайте отдельный файл и подключите его
 */

// Функция для обработки подписок из webhook Юкассы
function handle_yookassa_subscription($payment_data) {
    // Проверяем, это подписка или товар WooCommerce
    $metadata = $payment_data['metadata'] ?? [];
    $userId = $metadata['user_id'] ?? null;
    $subscriptionType = $metadata['subscription_type'] ?? null;
    
    // Если нет user_id или subscription_type, значит это не подписка, пропускаем
    if (!$userId || !$subscriptionType) {
        return false; // Это не подписка, пусть WooCommerce обрабатывает
    }
    
    // Это подписка, обрабатываем
    $paymentId = $payment_data['id'] ?? null;
    $amount = $payment_data['amount']['value'] ?? 0;
    
    if (!$paymentId) {
        error_log('YooKassa Subscription: Missing payment ID');
        return false;
    }
    
    // Вычисляем дату окончания подписки
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
    
    // Подготавливаем данные для обновления подписки
    $updateData = [
        'userId' => $userId,
        'subscription' => [
            'active' => true,
            'type' => $subscriptionType,
            'startDate' => date('c'),
            'endDate' => $subscriptionEndDate->format('c'),
            'paymentId' => $paymentId,
            'amount' => $amount
        ]
    ];
    
    // Секретный ключ (должен совпадать с .env.local)
    $webhookSecret = '1fddaef9da810cd310872383c3d27a05a2c97618ea94f358f3178e1ad23702c5';
    $nextjsApiUrl = 'https://pure-progression.com/api/subscription/update';
    
    // Отправляем запрос на обновление подписки через Next.js API
    $ch = curl_init($nextjsApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'X-Webhook-Secret: ' . $webhookSecret
    ]);
    
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

// Хук для обработки webhook от Юкассы (если используете WooCommerce)
// Добавьте это в functions.php вашей темы
add_action('woocommerce_api_yookassa_callback', 'process_yookassa_webhook', 10);

function process_yookassa_webhook() {
    // Получаем данные от Юкассы
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data || !isset($data['event'])) {
        return;
    }
    
    // Обрабатываем только успешные платежи
    if ($data['event'] !== 'payment.succeeded') {
        return;
    }
    
    $payment = $data['object'] ?? null;
    if (!$payment) {
        return;
    }
    
    // Проверяем, это подписка или товар WooCommerce
    $metadata = $payment['metadata'] ?? [];
    $userId = $metadata['user_id'] ?? null;
    
    if ($userId) {
        // Это подписка, обрабатываем отдельно
        handle_yookassa_subscription($payment);
        // НЕ прерываем выполнение, пусть WooCommerce тоже обработает (если нужно)
    }
    
    // WooCommerce продолжит обработку как обычно
}

