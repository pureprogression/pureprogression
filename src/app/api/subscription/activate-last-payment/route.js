import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

/**
 * API endpoint для активации подписки по последнему платежу пользователя
 * Используется если payment_id не приходит в URL
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

    // Проверяем наличие ключей
    if (!process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID || !process.env.YOOKASSA_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Payment configuration missing' },
        { status: 500 }
      );
    }

    // Получаем последние платежи пользователя из Firebase (если сохраняли)
    // Или проверяем последние платежи через API Юкассы
    
    // Пока что просто создаем подписку на месяц (для тестирования)
    // В реальности нужно найти последний успешный платеж через API Юкассы
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const subscriptionData = {
      active: true,
      type: 'monthly',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(endDate),
      paymentId: 'manual_activation_' + Date.now(),
      amount: 1,
      updatedAt: serverTimestamp()
    };

    // Обновляем подписку в Firebase
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await updateDoc(userRef, {
        subscription: subscriptionData,
        createdAt: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, {
        subscription: subscriptionData
      });
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

