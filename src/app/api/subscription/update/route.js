import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * API endpoint для обновления подписки пользователя
 * Вызывается из PHP webhook на pure-progression.ru
 */
export async function POST(request) {
  try {
    console.log('[Subscription Update] Webhook received');
    
    // Проверка секретного ключа для безопасности
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      console.error('[Subscription Update] Unauthorized - invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, subscription } = await request.json();
    console.log('[Subscription Update] Processing subscription for user:', userId, 'Subscription data:', subscription);

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Конвертируем строки дат в Firestore Timestamp
    const convertToTimestamp = (dateString) => {
      if (!dateString) return null;
      if (dateString instanceof Timestamp) return dateString;
      const date = new Date(dateString);
      return Timestamp.fromDate(date);
    };

    // Проверяем, существует ли пользователь
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    const subscriptionData = {
      active: subscription.active,
      type: subscription.type,
      startDate: convertToTimestamp(subscription.startDate),
      endDate: convertToTimestamp(subscription.endDate),
      paymentId: subscription.paymentId,
      amount: subscription.amount,
      updatedAt: serverTimestamp()
    };

    if (!userDoc.exists()) {
      // Создаем документ пользователя, если его нет
      // Используем setDoc с merge: true для создания или обновления
      await setDoc(userRef, {
        subscription: subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log(`[Subscription Update] Created new user document for ${userId}`);
    } else {
      // Обновляем существующую подписку
      await updateDoc(userRef, {
        subscription: subscriptionData,
        updatedAt: serverTimestamp()
      });
      console.log(`[Subscription Update] Updated subscription for existing user ${userId}`);
    }

    console.log('[Subscription Update] Successfully updated subscription for user:', userId);
    return NextResponse.json({ 
      success: true,
      message: 'Subscription updated successfully'
    });

  } catch (error) {
    console.error('[Subscription Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription: ' + error.message },
      { status: 500 }
    );
  }
}

