import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * API endpoint для активации подписки по payment_id из Firebase pendingPayments
 * Используется на странице success, если payment_id не пришел в URL
 */
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    console.log(`[Activate From Pending] Looking for pending payments for user ${userId}`);

    // Ищем последний необработанный платеж пользователя в pendingPayments
    const pendingPaymentsRef = collection(db, 'pendingPayments');
    
    // Пробуем запрос с orderBy, если не сработает - используем без него
    let querySnapshot;
    try {
      const q = query(
        pendingPaymentsRef,
        where('userId', '==', userId),
        where('processed', '==', false),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      querySnapshot = await getDocs(q);
    } catch (orderByError) {
      // Если orderBy не работает (нет индекса), делаем запрос без него
      console.log('[Activate From Pending] orderBy failed, trying without it:', orderByError.message);
      const q = query(
        pendingPaymentsRef,
        where('userId', '==', userId),
        where('processed', '==', false)
      );
      querySnapshot = await getDocs(q);
    }

    if (querySnapshot.empty) {
      console.log(`[Activate From Pending] No pending payments found for user ${userId}`);
      return NextResponse.json(
        { error: 'No pending payments found' },
        { status: 404 }
      );
    }

    // Если получили несколько документов, берем самый новый (по createdAt)
    let pendingPaymentDoc = querySnapshot.docs[0];
    if (querySnapshot.docs.length > 1) {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data(),
        createdAt: doc.data().createdAt
      }));
      // Сортируем по createdAt (новые первыми)
      docs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
        return bTime - aTime;
      });
      // Находим документ с самым новым createdAt
      const newestDoc = querySnapshot.docs.find(doc => doc.id === docs[0].id);
      if (newestDoc) {
        pendingPaymentDoc = newestDoc;
      }
    }

    const pendingPayment = pendingPaymentDoc.data();
    const paymentId = pendingPaymentDoc.id;

    console.log(`[Activate From Pending] Found pending payment ${paymentId}`, pendingPayment);

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
      const errorText = await paymentResponse.text();
      console.error(`[Activate From Pending] Failed to verify payment ${paymentId}:`, errorText);
      return NextResponse.json(
        { error: 'Failed to verify payment', details: errorText },
        { status: 500 }
      );
    }

    const payment = await paymentResponse.json();

    console.log(`[Activate From Pending] Payment ${paymentId} status:`, {
      status: payment.status,
      paid: payment.paid,
      cancelled: payment.cancelled,
      captured_at: payment.captured_at
    });

    // Если платеж в статусе waiting_for_capture, автоматически захватываем его
    if (payment.status === 'waiting_for_capture' && payment.paid) {
      console.log(`[Activate From Pending] Payment ${paymentId} is waiting for capture, capturing automatically...`);
      
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
          console.log(`[Activate From Pending] Payment ${paymentId} captured successfully, new status: ${capturedPayment.status}`);
          // Обновляем объект payment для дальнейшей обработки
          payment.status = capturedPayment.status;
          payment.paid = capturedPayment.paid;
          payment.captured_at = capturedPayment.captured_at;
        } else {
          const captureError = await captureResponse.json();
          console.error(`[Activate From Pending] Failed to capture payment ${paymentId}:`, captureError);
          return NextResponse.json(
            { 
              error: 'Failed to capture payment',
              status: payment.status,
              paid: payment.paid,
              message: 'Платеж оплачен, но не удалось завершить захват. Попробуйте позже.',
              paymentDetails: {
                status: payment.status,
                paid: payment.paid,
                captured_at: payment.captured_at,
                created_at: payment.created_at
              }
            },
            { status: 500 }
          );
        }
      } catch (captureError) {
        console.error(`[Activate From Pending] Error capturing payment ${paymentId}:`, captureError);
        return NextResponse.json(
          { 
            error: 'Failed to capture payment',
            status: payment.status,
            paid: payment.paid,
            message: 'Ошибка при завершении платежа: ' + captureError.message,
            paymentDetails: {
              status: payment.status,
              paid: payment.paid,
              captured_at: payment.captured_at,
              created_at: payment.created_at
            }
          },
          { status: 500 }
        );
      }
    }

    // Проверяем, что платеж успешен или оплачен (для СБП может быть paid=true, но статус еще не succeeded)
    // Если платеж оплачен (paid=true), но статус еще не succeeded, все равно активируем подписку
    if (!payment.paid) {
      const statusMessage = payment.status === 'pending' 
        ? 'Платеж обрабатывается. Подождите несколько минут и попробуйте снова.'
        : payment.status === 'canceled' || payment.cancelled
        ? 'Платеж отменен.'
        : `Платеж не оплачен. Статус: ${payment.status}`;
      
      console.log(`[Activate From Pending] Payment ${paymentId} not paid yet. Status: ${payment.status}, Paid: ${payment.paid}`);
      return NextResponse.json(
        { 
          error: 'Payment not completed',
          status: payment.status,
          paid: payment.paid,
          message: statusMessage,
          paymentDetails: {
            status: payment.status,
            paid: payment.paid,
            cancelled: payment.cancelled,
            captured_at: payment.captured_at,
            created_at: payment.created_at
          }
        },
        { status: 400 }
      );
    }

    // Если платеж оплачен (paid=true), но статус еще не succeeded, пытаемся захватить его еще раз
    if (payment.paid && payment.status !== 'succeeded' && payment.status !== 'waiting_for_capture') {
      console.log(`[Activate From Pending] Payment ${paymentId} is paid but status is ${payment.status}, attempting to capture...`);
      // Пытаемся захватить платеж еще раз
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
          console.log(`[Activate From Pending] Payment ${paymentId} captured successfully, new status: ${capturedPayment.status}`);
          payment.status = capturedPayment.status;
        }
      } catch (error) {
        console.warn(`[Activate From Pending] Could not capture payment, but continuing with activation since paid=true:`, error);
      }
    }

    // Если платеж оплачен (paid=true), активируем подписку даже если статус еще не succeeded
    // Это важно для СБП, где платеж может быть оплачен, но статус обновляется с задержкой
    if (!payment.paid) {
      console.log(`[Activate From Pending] Payment ${paymentId} is not paid, cannot activate subscription`);
      return NextResponse.json(
        { 
          error: 'Payment not paid',
          status: payment.status,
          paid: payment.paid,
          message: 'Платеж не оплачен'
        },
        { status: 400 }
      );
    }

    // Используем subscriptionType из pendingPayment или из metadata платежа
    const subscriptionType = pendingPayment.subscriptionType || 
                            payment.metadata?.subscription_type || 
                            'monthly';

    console.log(`[Activate From Pending] Activating subscription type: ${subscriptionType}`);

    // Пытаемся получить email из pendingPayment (делаем это раньше, чтобы использовать в проверке)
    const pendingEmail = pendingPaymentData.email || null;
    
    // Вычисляем дату окончания подписки
    const now = new Date();
    let endDate = new Date(now);
    
    // Проверяем, есть ли активная подписка
    // ВАЖНО: Всегда сначала ищем по email, чтобы избежать дубликатов
    // Сначала проверяем документ с userId
    let userRef = doc(db, 'users', userId);
    let userDoc = await getDoc(userRef);
    
    // Если документ не найден по userId, но есть email - ищем существующий документ по email
    if (!userDoc.exists() && pendingEmail) {
      console.log(`[Activate From Pending] User document not found by userId, searching by email: ${pendingEmail}`);
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', pendingEmail), limit(1));
      const emailQuerySnapshot = await getDocs(emailQuery);
      
      if (!emailQuerySnapshot.empty) {
        const existingUserDoc = emailQuerySnapshot.docs[0];
        const existingUserId = existingUserDoc.id;
        console.log(`[Activate From Pending] ✅ Found existing user by email: ${existingUserId}, using it instead of creating new`);
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
          console.log(`[Activate From Pending] Extending existing subscription from ${existingEndDate.toISOString()}`);
        }
      }
    }
    
    // Добавляем период новой подписки
    // Используем более надежный способ: добавляем дни напрямую
    const beforeAdd = new Date(endDate);
    const daysToAdd = (() => {
      switch (subscriptionType) {
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
    console.log(`[Activate From Pending] Adding ${daysToAdd} days (${subscriptionType}): ${beforeAdd.toISOString()} -> ${endDate.toISOString()}`);
    
    console.log(`[Activate From Pending] Final end date: ${endDate.toISOString()}, subscription type: ${subscriptionType}`);

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
      console.log(`[Activate From Pending] Keeping original start date: ${startDate.toISOString()}`);
    }

    // Конвертируем в Firestore Timestamp
    const subscriptionData = {
      active: true,
      type: subscriptionType,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      paymentId: paymentId,
      amount: payment.amount.value || pendingPayment.amount,
      updatedAt: serverTimestamp()
    };

    console.log(`[Activate From Pending] Creating subscription:`, subscriptionData);
    
    if (!userDoc.exists()) {
      // Создаем документ пользователя, если его нет (и не найден по email)
      const userDataToSave = {
        subscription: subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Сохраняем email, если он есть в pendingPayment
      if (pendingEmail) {
        userDataToSave.email = pendingEmail;
        console.log(`[Activate From Pending] Saving email from pending payment: ${pendingEmail}`);
      }
      
      await setDoc(userRef, userDataToSave, { merge: true });
      console.log(`[Activate From Pending] Created new user document for ${userId}`);
    } else {
      // Если email отсутствует в документе, но есть в pendingPayment, обновляем
      const currentUserData = userDoc.data();
      if (!currentUserData.email && pendingEmail) {
        await updateDoc(userRef, {
          email: pendingEmail,
          updatedAt: serverTimestamp()
        });
        console.log(`[Activate From Pending] Updated email from pending payment: ${pendingEmail}`);
      }
      // Обновляем существующую подписку
      await updateDoc(userRef, {
        subscription: subscriptionData,
        updatedAt: serverTimestamp()
      });
      console.log(`[Activate From Pending] Updated subscription for existing user ${userId}`);
    }

    // Помечаем pendingPayment как обработанный
    await updateDoc(pendingPaymentDoc.ref, {
      processed: true,
      processedAt: serverTimestamp()
    });
    console.log(`[Activate From Pending] Marked pending payment ${paymentId} as processed`);

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      paymentId: paymentId,
      subscriptionType: subscriptionType
    });

  } catch (error) {
    console.error('[Activate From Pending] Error:', error);
    return NextResponse.json(
      { error: 'Failed to activate subscription: ' + error.message },
      { status: 500 }
    );
  }
}

