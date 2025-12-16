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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
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
    switch (subscriptionType) {
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

    // Создаем данные подписки
    const subscriptionData = {
      active: true,
      type: subscriptionType,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      paymentId: `manual_${Date.now()}`,
      amount: 1,
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

