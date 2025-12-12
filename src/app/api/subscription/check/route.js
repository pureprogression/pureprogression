import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * API endpoint для проверки статуса подписки пользователя
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    const userData = userDoc.data();
    const subscription = userData.subscription || null;

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null
      });
    }

    // Проверяем, активна ли подписка и не истекла ли она
    const now = new Date();
    const endDate = subscription.endDate?.toDate ? subscription.endDate.toDate() : new Date(subscription.endDate);
    
    const isActive = subscription.active && endDate > now;

    return NextResponse.json({
      hasSubscription: isActive,
      subscription: {
        active: isActive,
        type: subscription.type,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        expiresAt: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription: ' + error.message },
      { status: 500 }
    );
  }
}

