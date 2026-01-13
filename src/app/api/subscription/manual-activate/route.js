import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * API endpoint для ручной активации подписки администратором
 * POST /api/subscription/manual-activate
 * Body: { email: string, subscriptionType: 'monthly' | '3months' | 'yearly' }
 */
export async function POST(request) {
  try {
    const { email, subscriptionType = 'monthly' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email' },
        { status: 400 }
      );
    }

    console.log(`[Manual Activate] Activating subscription for ${email}...`);

    // Находим пользователя по email в коллекции users
    // ВАЖНО: Всегда используем первый найденный документ с таким email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }

    // Если найдено несколько документов с таким email, используем первый (самый старый)
    // и логируем предупреждение
    if (querySnapshot.size > 1) {
      console.warn(`[Manual Activate] ⚠️ Found ${querySnapshot.size} documents with email ${email}, using the first one`);
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    console.log(`[Manual Activate] Found user: ${userId}`);

    // Вычисляем дату окончания подписки
    const now = new Date();
    let endDate = new Date(now);
    
    // Проверяем, есть ли активная подписка
    const userRef = doc(db, 'users', userId);
    const userDocSnapshot = await getDoc(userRef);
    
    let existingEndDate = null;
    if (userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
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
          console.log(`[Manual Activate] Extending existing subscription from ${existingEndDate.toISOString()}`);
        }
      }
    }
    
    // Добавляем период новой подписки
    // Используем более надежный способ: добавляем дни напрямую
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
    console.log(`[Manual Activate] Adding ${daysToAdd} days (${subscriptionType}): ${endDate.toISOString()}`);

    // Определяем startDate: если продлеваем - оставляем старую, если новая - текущая дата
    let startDate = now;
    if (existingEndDate && existingEndDate > now && userDocSnapshot.exists()) {
      const userData = userDocSnapshot.data();
      const existingSubscription = userData.subscription;
      if (existingSubscription.startDate?.toDate) {
        startDate = existingSubscription.startDate.toDate();
      } else if (existingSubscription.startDate?.seconds) {
        startDate = new Date(existingSubscription.startDate.seconds * 1000);
      }
      console.log(`[Manual Activate] Keeping original start date: ${startDate.toISOString()}`);
    }

    // Определяем сумму подписки
    let subscriptionAmount = 990;
    switch (subscriptionType) {
      case 'monthly':
        subscriptionAmount = 990;
        break;
      case '3months':
        subscriptionAmount = 2490;
        break;
      case 'yearly':
        subscriptionAmount = 8290;
        break;
      default:
        subscriptionAmount = 990;
    }

    // Создаем данные подписки
    const subscriptionData = {
      active: true,
      type: subscriptionType,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      paymentId: `manual_${Date.now()}`,
      amount: subscriptionAmount,
      updatedAt: serverTimestamp()
    };

    if (!userDocSnapshot.exists()) {
      // Создаем документ пользователя, если его нет
      await setDoc(userRef, {
        email: email,
        subscription: subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`[Manual Activate] Created new user document for ${userId}`);
    } else {
      // Обновляем существующую подписку
      await updateDoc(userRef, {
        subscription: subscriptionData,
        updatedAt: serverTimestamp()
      });
      console.log(`[Manual Activate] Updated subscription for existing user ${userId}`);
    }

    // Проверяем, что подписка действительно сохранилась
    const verifyDoc = await getDoc(userRef);
    const verifyData = verifyDoc.exists() ? verifyDoc.data() : {};
    
    if (!verifyData.subscription || !verifyData.subscription.active) {
      console.error(`[Manual Activate] ❌ Subscription was not saved correctly for ${userId}`);
      return NextResponse.json(
        { error: 'Subscription was not saved correctly', success: false },
        { status: 500 }
      );
    }
    
    console.log(`[Manual Activate] ✅ Subscription verified for ${userId}:`, {
      active: verifyData.subscription.active,
      type: verifyData.subscription.type,
      endDate: verifyData.subscription.endDate
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      userId: userId,
      subscriptionType: subscriptionType,
      endDate: endDate.toISOString()
    });

  } catch (error) {
    console.error('[Manual Activate] Error:', error);
    return NextResponse.json(
      { error: 'Failed to activate subscription: ' + error.message },
      { status: 500 }
    );
  }
}

