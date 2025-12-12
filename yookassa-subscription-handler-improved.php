<?php
/**
 * УЛУЧШЕННЫЙ обработчик подписок для существующего WooCommerce webhook
 * Добавьте этот код в functions.php вашей темы WordPress
 * 
 * ВАЖНО: Вставляйте код БЕЗ открывающего тега <?php в начале
 */

// Функция для обработки подписок из webhook Юкассы
function handle_yookassa_subscription($payment_data) {
    // Логируем начало обработки
    error_log('YooKassa Subscription: Starting processing');
    error_log('YooKassa Subscription: Payment data: ' . json_encode($payment_data));
    
    // Проверяем, это подписка или товар WooCommerce
    $metadata = isset($payment_data['metadata']) ? $payment_data['metadata'] : array();
    $userId = isset($metadata['user_id']) ? $metadata['user_id'] : null;
    $subscriptionType = isset($metadata['subscription_type']) ? $metadata['subscription_type'] : null;
    
    error_log('YooKassa Subscription: Metadata: ' . json_encode($metadata));
    error_log('YooKassa Subscription: User ID: ' . $userId);
    error_log('YooKassa Subscription: Subscription Type: ' . $subscriptionType);
    
    // Если нет user_id или subscription_type, значит это не подписка, пропускаем
    if (!$userId || !$subscriptionType) {
        error_log('YooKassa Subscription: Not a subscription payment (missing user_id or subscription_type)');
        return false; // Это не подписка, пусть WooCommerce обрабатывает
    }
    
    // Это подписка, обрабатываем
    $paymentId = isset($payment_data['id']) ? $payment_data['id'] : null;
    $amount = isset($payment_data['amount']['value']) ? $payment_data['amount']['value'] : 0;
    
    if (!$paymentId) {
        error_log('YooKassa Subscription: Missing payment ID');
        return false;
    }
    
    error_log('YooKassa Subscription: Processing subscription for user ' . $userId . ', payment ' . $paymentId);
    
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
    
    error_log('YooKassa Subscription: Update data: ' . json_encode($updateData));
    
    // Секретный ключ (должен совпадать с .env.local)
    $webhookSecret = '1fddaef9da810cd310872383c3d27a05a2c97618ea94f358f3178e1ad23702c5';
    $nextjsApiUrl = 'https://pure-progression.com/api/subscription/update';
    
    error_log('YooKassa Subscription: Sending request to ' . $nextjsApiUrl);
    
    // Отправляем запрос на обновление подписки через Next.js API
    $ch = curl_init($nextjsApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'X-Webhook-Secret: ' . $webhookSecret
    ));
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        error_log('YooKassa Subscription: cURL Error: ' . $curlError);
    }
    
    error_log('YooKassa Subscription: Response HTTP Code: ' . $httpCode);
    error_log('YooKassa Subscription: Response: ' . $response);
    
    if ($httpCode === 200) {
        error_log("YooKassa Subscription: Updated successfully for user $userId");
        return true;
    } else {
        error_log("YooKassa Subscription: Failed to update. HTTP Code: $httpCode, Response: $response");
        return false;
    }
}

// Хук для обработки webhook от Юкассы через WooCommerce
add_action('woocommerce_api_yookassa_callback', 'process_yookassa_subscription_webhook', 5);

function process_yookassa_subscription_webhook() {
    error_log('YooKassa Subscription: Webhook received');
    
    // Получаем данные от Юкассы
    $input = file_get_contents('php://input');
    error_log('YooKassa Subscription: Raw input: ' . $input);
    
    $data = json_decode($input, true);
    
    if (!$data) {
        error_log('YooKassa Subscription: Failed to decode JSON');
        return;
    }
    
    error_log('YooKassa Subscription: Decoded data: ' . json_encode($data));
    
    if (!isset($data['event'])) {
        error_log('YooKassa Subscription: No event in data');
        return;
    }
    
    error_log('YooKassa Subscription: Event: ' . $data['event']);
    
    // Обрабатываем только успешные платежи
    if ($data['event'] !== 'payment.succeeded') {
        error_log('YooKassa Subscription: Event is not payment.succeeded, ignoring');
        return;
    }
    
    $payment = isset($data['object']) ? $data['object'] : null;
    if (!$payment) {
        error_log('YooKassa Subscription: No payment object in data');
        return;
    }
    
    error_log('YooKassa Subscription: Payment object: ' . json_encode($payment));
    
    // Проверяем, это подписка или товар WooCommerce
    $metadata = isset($payment['metadata']) ? $payment['metadata'] : array();
    $userId = isset($metadata['user_id']) ? $metadata['user_id'] : null;
    
    error_log('YooKassa Subscription: Checking metadata for user_id: ' . ($userId ? $userId : 'NOT FOUND'));
    
    if ($userId) {
        // Это подписка, обрабатываем отдельно
        error_log('YooKassa Subscription: This is a subscription payment, processing...');
        $result = handle_yookassa_subscription($payment);
        error_log('YooKassa Subscription: Processing result: ' . ($result ? 'SUCCESS' : 'FAILED'));
        // НЕ прерываем выполнение, пусть WooCommerce тоже обработает (если нужно)
    } else {
        error_log('YooKassa Subscription: This is NOT a subscription payment (no user_id in metadata), skipping');
    }
    
    // WooCommerce продолжит обработку как обычно
}

