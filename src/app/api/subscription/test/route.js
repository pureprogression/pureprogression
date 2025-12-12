import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Временный endpoint для тестирования подписки
 * Использование: POST /api/subscription/test
 * Body: { userId: "your-user-id" }
 */
export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Создаем тестовую подписку на 1 месяц
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscriptionData = {
      active: true,
      type: 'monthly',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(endDate),
      paymentId: 'test_payment_' + Date.now(),
      amount: 1,
      updatedAt: serverTimestamp()
    };

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Создаем документ пользователя
      await updateDoc(userRef, {
        subscription: subscriptionData,
        createdAt: serverTimestamp()
      });
    } else {
      // Обновляем подписку
      await updateDoc(userRef, {
        subscription: subscriptionData
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Test subscription created',
      subscription: subscriptionData
    });

  } catch (error) {
    console.error('Test subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create test subscription: ' + error.message },
      { status: 500 }
    );
  }
}

