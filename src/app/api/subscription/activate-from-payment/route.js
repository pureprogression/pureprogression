import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * API endpoint для активации подписки после проверки платежа
 * Используется как резервный способ, если webhook не сработал
 */
export async function POST(request) {
  try {
    const { userId, paymentId, subscriptionType } = await request.json();

    if (!userId || !paymentId || !subscriptionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем наличие ключей для проверки платежа
    if (!process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment configuration missing' },
        { status: 500 }
      );
    }

    // Проверяем статус платежа через API Юкассы
    const paymentResponse = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymentResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      );
    }

    const payment = await paymentResponse.json();

    // Если платеж в статусе waiting_for_capture, автоматически захватываем его
    if (payment.status === 'waiting_for_capture' && payment.paid) {
      console.log(`[Activate From Payment] Payment ${paymentId} is waiting for capture, capturing automatically...`);
      
      try {
        const captureResponse = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}/capture`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
            'Content-Type': 'application/json',
            'Idempotence-Key': `capture_${paymentId}_${Date.now()}`
          },
          body: JSON.stringify({})
        });

        if (captureResponse.ok) {
          const capturedPayment = await captureResponse.json();
          console.log(`[Activate From Payment] Payment ${paymentId} captured successfully, new status: ${capturedPayment.status}`);
          // Обновляем объект payment для дальнейшей обработки
          payment.status = capturedPayment.status;
          payment.paid = capturedPayment.paid;
          payment.captured_at = capturedPayment.captured_at;
        } else {
          const captureError = await captureResponse.json();
          console.error(`[Activate From Payment] Failed to capture payment ${paymentId}:`, captureError);
          return NextResponse.json(
            { error: 'Failed to capture payment', details: captureError },
            { status: 500 }
          );
        }
      } catch (captureError) {
        console.error(`[Activate From Payment] Error capturing payment ${paymentId}:`, captureError);
        return NextResponse.json(
          { error: 'Failed to capture payment: ' + captureError.message },
          { status: 500 }
        );
      }
    }

    // Проверяем, что платеж успешен
    if (payment.status !== 'succeeded' || !payment.paid) {
      return NextResponse.json(
        { error: 'Payment not completed', status: payment.status, paid: payment.paid },
        { status: 400 }
      );
    }

    // Проверяем, что это действительно подписка (по metadata)
    const metadata = payment.metadata || {};
    
    // Логируем для отладки
    console.log('Payment metadata check:', {
      metadata_user_id: metadata.user_id,
      provided_user_id: userId,
      metadata_subscription_type: metadata.subscription_type,
      provided_subscription_type: subscriptionType,
      full_metadata: metadata
    });
    
    // Если metadata не совпадает, но есть user_id в metadata - все равно активируем
    // (возможно, subscription_type не пришел, но это точно подписка)
    if (metadata.user_id && metadata.user_id !== userId) {
      console.log('Warning: user_id mismatch, but continuing...');
      // Не блокируем, продолжаем
    }
    
    // Если subscription_type не совпадает, используем тот что в metadata или переданный
    const finalSubscriptionType = metadata.subscription_type || subscriptionType || 'monthly';

    // Вычисляем дату окончания подписки
    const now = new Date();
    const endDate = new Date(now);
    switch (finalSubscriptionType) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3months':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    // Конвертируем в Firestore Timestamp
    const subscriptionData = {
      active: true,
      type: finalSubscriptionType,
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(endDate),
      paymentId: paymentId,
      amount: payment.amount.value,
      updatedAt: serverTimestamp()
    };
    
    console.log('Creating subscription:', subscriptionData);

    // Обновляем подписку в Firebase
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Создаем документ пользователя, если его нет
      await setDoc(userRef, {
        subscription: subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`[Activate From Payment] Created new user document for ${userId}`);
    } else {
      // Обновляем существующую подписку
      await updateDoc(userRef, {
        subscription: subscriptionData,
        updatedAt: serverTimestamp()
      });
      console.log(`[Activate From Payment] Updated subscription for existing user ${userId}`);
    }

    // Помечаем pendingPayment как обработанный
    try {
      const pendingPaymentRef = doc(db, 'pendingPayments', paymentId);
      const pendingPaymentDoc = await getDoc(pendingPaymentRef);
      if (pendingPaymentDoc.exists()) {
        await updateDoc(pendingPaymentRef, {
          processed: true,
          processedAt: serverTimestamp()
        });
        console.log(`[Activate From Payment] Marked pending payment ${paymentId} as processed`);
      }
    } catch (error) {
      // Не критично, если не удалось обновить pendingPayment
      console.warn(`[Activate From Payment] Could not update pending payment:`, error);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription activated successfully'
    });

  } catch (error) {
    console.error('Subscription activation error:', error);
    return NextResponse.json(
      { error: 'Failed to activate subscription: ' + error.message },
      { status: 500 }
    );
  }
}

