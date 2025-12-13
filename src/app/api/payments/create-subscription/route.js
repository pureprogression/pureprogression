import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { userId, subscriptionType, amount, description } = await request.json();

    // Валидация
    if (!userId || !subscriptionType || !amount || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем наличие ключей
    const missingVars = [];
    if (!process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID) {
      missingVars.push('NEXT_PUBLIC_YOOKASSA_SHOP_ID');
    }
    if (!process.env.YOOKASSA_SECRET_KEY) {
      missingVars.push('YOOKASSA_SECRET_KEY');
    }
    
    if (missingVars.length > 0) {
      console.error('[Subscription Payment] Missing environment variables:', missingVars);
      return NextResponse.json(
        { 
          error: 'Payment configuration missing',
          details: `Missing environment variables: ${missingVars.join(', ')}. Please configure them in Vercel project settings.`
        },
        { status: 500 }
      );
    }

    // URL для webhook (на pure-progression.ru)
    const webhookUrl = process.env.NODE_ENV === 'production'
      ? 'https://pure-progression.ru/api/yookassa-webhook.php'
      : 'https://pure-progression.ru/api/yookassa-webhook.php'; // Для тестирования тоже используем production URL

    // URL для возврата после оплаты (на pure-progression.com)
    const returnUrl = process.env.NODE_ENV === 'production'
      ? 'https://pure-progression.com/payment/success?type=subscription'
      : 'http://localhost:3000/payment/success?type=subscription';

    // Создаем платеж через API ЮKassы
    // Используем одностадийную схему (capture: true) для моментального завершения платежа
    const paymentData = {
      amount: {
        value: amount.toString(),
        currency: 'RUB'
      },
      confirmation: {
        type: 'redirect',
        return_url: returnUrl
      },
      capture: true, // Одностадийная схема - платеж сразу захватывается после оплаты
      description: description,
      metadata: {
        user_id: userId,
        subscription_type: subscriptionType,
        order_id: `subscription_${userId}_${Date.now()}`
      },
      receipt: {
        customer: {
          email: 'subscription@pure-progression.com' // Можно получить из Firebase если нужно
        },
        items: [
          {
            description: description,
            amount: {
              value: amount.toString(),
              currency: 'RUB'
            },
            vat_code: 4, // Без НДС
            quantity: '1'
          }
        ]
      },
      // Добавляем webhook URL в настройки (если поддерживается)
      // Или настраиваем в личном кабинете Юкассы
    };

    // Генерируем короткий Idempotence-Key (максимум 36 символов для Юкассы)
    // Используем короткий формат: первые 8 символов userId + timestamp + случайные символы
    const shortUserId = userId.substring(0, 8);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const idempotenceKey = `${shortUserId}_${timestamp}_${random}`.substring(0, 36);

    console.log('[Subscription Payment] Creating payment via YooKassa API...');
    const yookassaStartTime = Date.now();

    // Создаем AbortController для таймаута
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут

    try {
      const response = await fetch('https://api.yookassa.ru/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
          'Content-Type': 'application/json',
          'Idempotence-Key': idempotenceKey
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const yookassaTime = Date.now() - yookassaStartTime;
      console.log(`[Subscription Payment] YooKassa API response received in ${yookassaTime}ms`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`YooKassa API error: ${JSON.stringify(errorData)}`);
      }

      const payment = await response.json();
      console.log(`[Subscription Payment] Payment created: ${payment.id}`);

      // Сохраняем payment_id в Firebase для последующей активации подписки (не блокируем ответ)
      const firebaseStartTime = Date.now();
      setDoc(doc(db, 'pendingPayments', payment.id), {
        userId: userId,
        subscriptionType: subscriptionType,
        amount: amount,
        status: 'pending',
        createdAt: serverTimestamp(),
        processed: false
      }).then(() => {
        const firebaseTime = Date.now() - firebaseStartTime;
        console.log(`[Subscription Payment] Saved pending payment ${payment.id} for user ${userId} in ${firebaseTime}ms`);
      }).catch((firebaseError) => {
        // Логируем ошибку, но не прерываем процесс создания платежа
        console.error('[Subscription Payment] Failed to save pending payment:', firebaseError);
      });

      return NextResponse.json({
        success: true,
        paymentId: payment.id,
        redirectUrl: payment.confirmation.confirmation_url,
        amount: amount,
        currency: 'RUB',
        description: description,
        status: 'pending',
        subscriptionType: subscriptionType
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Subscription Payment] Request timeout after 15 seconds');
        throw new Error('Request timeout: YooKassa API did not respond in time');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Subscription payment creation error:', error);
    return NextResponse.json(
      { error: 'Subscription payment creation failed: ' + error.message },
      { status: 500 }
    );
  }
}

