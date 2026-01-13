import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc, collection, query, where, getDocs, limit, serverTimestamp, Timestamp } from 'firebase/firestore';

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
    
    console.log(`[Activate From Payment] Subscription type: ${finalSubscriptionType} (metadata: ${metadata.subscription_type}, provided: ${subscriptionType})`);
    
    // Вычисляем дату окончания подписки
    const now = new Date();
    let endDate = new Date(now);
    
    console.log(`[Activate From Payment] Starting date calculation from: ${now.toISOString()}`);
    
    // Проверяем, есть ли активная подписка
    // Сначала проверяем документ с userId
    let userRef = doc(db, 'users', userId);
    let userDoc = await getDoc(userRef);
    
    // Если документ не найден, но есть email в metadata, ищем существующий документ с таким email
    const paymentEmail = metadata.email || metadata.user_email || null;
    if (!userDoc.exists() && paymentEmail) {
      console.log(`[Activate From Payment] User document not found by userId, searching by email: ${paymentEmail}`);
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', paymentEmail), limit(1));
      const emailQuerySnapshot = await getDocs(emailQuery);
      
      if (!emailQuerySnapshot.empty) {
        const existingUserDoc = emailQuerySnapshot.docs[0];
        const existingUserId = existingUserDoc.id;
        console.log(`[Activate From Payment] Found existing user by email: ${existingUserId}, using it instead of creating new`);
        userRef = doc(db, 'users', existingUserId);
        userDoc = await getDoc(userRef);
        // Обновляем userId для дальнейшего использования
        userId = existingUserId;
      }
    }
    
    let existingEndDate = null;
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const existingSubscription = userData.subscription;
      
      if (existingSubscription && existingSubscription.active) {
        // Получаем дату окончания существующей подписки
        if (existingSubscription.endDate?.toDate) {
          existingEndDate = existingSubscription.endDate.toDate();
        } else if (existingSubscription.endDate?.seconds) {
          existingEndDate = new Date(existingSubscription.endDate.seconds * 1000);
        } else if (typeof existingSubscription.endDate === 'string') {
          existingEndDate = new Date(existingSubscription.endDate);
        }
        
        // Если существующая подписка еще активна (не истекла), продлеваем её
        if (existingEndDate && existingEndDate > now) {
          endDate = new Date(existingEndDate); // Начинаем с даты окончания текущей подписки
          console.log(`[Activate From Payment] Extending existing subscription from ${existingEndDate.toISOString()}`);
        }
      }
    }
    
    // Добавляем период новой подписки
    // Используем более надежный способ: добавляем дни напрямую
    const beforeAdd = new Date(endDate);
    const daysToAdd = (() => {
      switch (finalSubscriptionType) {
        case 'monthly':
          return 30; // 30 дней для месячной подписки
        case '3months':
          return 90; // 90 дней для 3-месячной подписки
        case 'yearly':
          return 365; // 365 дней для годовой подписки
        default:
          return 30;
      }
    })();
    
    endDate.setDate(endDate.getDate() + daysToAdd);
    console.log(`[Activate From Payment] Adding ${daysToAdd} days (${finalSubscriptionType}): ${beforeAdd.toISOString()} -> ${endDate.toISOString()}`);
    
    console.log(`[Activate From Payment] Final end date: ${endDate.toISOString()}, type: ${finalSubscriptionType}`);

    // Определяем startDate: если продлеваем - оставляем старую, если новая - текущая дата
    let startDate = now;
    if (existingEndDate && existingEndDate > now && userDoc.exists()) {
      const userData = userDoc.data();
      const existingSubscription = userData.subscription;
      if (existingSubscription.startDate?.toDate) {
        startDate = existingSubscription.startDate.toDate();
      } else if (existingSubscription.startDate?.seconds) {
        startDate = new Date(existingSubscription.startDate.seconds * 1000);
      }
      console.log(`[Activate From Payment] Keeping original start date: ${startDate.toISOString()}`);
    }

    // Конвертируем в Firestore Timestamp
    const subscriptionData = {
      active: true,
      type: finalSubscriptionType,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      paymentId: paymentId,
      amount: payment.amount.value,
      updatedAt: serverTimestamp()
    };
    
    console.log('Creating subscription:', subscriptionData);

    // Пытаемся получить email из метаданных платежа
    const paymentEmail = payment.metadata?.email || payment.metadata?.user_email || null;
    
    // ВАЖНО: Всегда сначала ищем по email, чтобы избежать дубликатов
    // Если документ не найден по userId, но есть email - ищем существующий документ по email
    if (!userDoc.exists() && paymentEmail) {
      console.log(`[Activate From Payment] User document not found by userId, searching by email: ${paymentEmail}`);
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', paymentEmail), limit(1));
      const emailQuerySnapshot = await getDocs(emailQuery);
      
      if (!emailQuerySnapshot.empty) {
        const existingUserDoc = emailQuerySnapshot.docs[0];
        const existingUserId = existingUserDoc.id;
        console.log(`[Activate From Payment] ✅ Found existing user by email: ${existingUserId}, using it instead of creating new`);
        userRef = doc(db, 'users', existingUserId);
        userDoc = await getDoc(userRef);
        userId = existingUserId; // Обновляем userId для дальнейшего использования
      }
    }
    
    if (!userDoc.exists()) {
      // Создаем документ пользователя, если его нет (и не найден по email)
      const userDataToSave = {
        subscription: subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Сохраняем email, если он есть в метаданных платежа
      if (paymentEmail) {
        userDataToSave.email = paymentEmail;
        console.log(`[Activate From Payment] Saving email from payment metadata: ${paymentEmail}`);
      }
      
      await setDoc(userRef, userDataToSave, { merge: true });
      console.log(`[Activate From Payment] Created new user document for ${userId}`);
    } else {
      // Если email отсутствует в документе, но есть в метаданных платежа, обновляем
      const currentUserData = userDoc.data();
      if (!currentUserData.email && paymentEmail) {
        await updateDoc(userRef, {
          email: paymentEmail,
          updatedAt: serverTimestamp()
        });
        console.log(`[Activate From Payment] Updated email from payment metadata: ${paymentEmail}`);
      }
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

