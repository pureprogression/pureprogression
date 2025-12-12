<?php
/**
 * Webhook для обработки платежей Юкассы
 * Разместить этот файл на pure-progression.ru в корне или в папке /api/
 * URL для настройки в Юкассе: https://pure-progression.ru/api/yookassa-webhook.php
 * 
 * Или если разместите в корне: https://pure-progression.ru/yookassa-webhook.php
 */

// Настройки
// Секретный ключ для защиты webhook (должен совпадать с WEBHOOK_SECRET в .env.local Next.js)
define('WEBHOOK_SECRET', '1fddaef9da810cd310872383c3d27a05a2c97618ea94f358f3178e1ad23702c5');

// URL API для обновления подписки на Next.js сайте
define('NEXTJS_API_URL', 'https://pure-progression.com/api/subscription/update');

// Логирование (для отладки)
$log_file = __DIR__ . '/yookassa-webhook.log';

function log_message($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND);
}

// Получаем данные от Юкассы
$input = file_get_contents('php://input');
$data = json_decode($input, true);

log_message("Webhook received: " . $input);

// Проверяем, что это POST запрос
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Проверяем наличие данных
if (!$data || !isset($data['event'])) {
    log_message("Invalid webhook data");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid data']);
    exit;
}

// Обрабатываем только событие payment.succeeded
if ($data['event'] !== 'payment.succeeded') {
    log_message("Event ignored: " . $data['event']);
    http_response_code(200);
    echo json_encode(['status' => 'ignored']);
    exit;
}

// Получаем информацию о платеже
$payment = $data['object'];
$paymentId = $payment['id'] ?? null;
$userId = $payment['metadata']['user_id'] ?? null;
$subscriptionType = $payment['metadata']['subscription_type'] ?? 'monthly'; // monthly, 3months, yearly
$amount = $payment['amount']['value'] ?? 0;

log_message("Processing payment: $paymentId for user: $userId");

if (!$paymentId || !$userId) {
    log_message("Missing payment ID or user ID");
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
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

// Отправляем запрос на обновление подписки через Next.js API
$ch = curl_init(NEXTJS_API_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updateData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Secret: ' . WEBHOOK_SECRET
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    log_message("Subscription updated successfully for user: $userId");
    http_response_code(200);
    echo json_encode(['status' => 'success']);
} else {
    log_message("Failed to update subscription. HTTP Code: $httpCode, Response: $response");
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update subscription']);
}

