import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
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

    // Получаем информацию о платеже через API ЮKassы
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`YooKassa API error: ${JSON.stringify(errorData)}`);
    }

    const payment = await response.json();

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status, // pending, succeeded, canceled, failed
      amount: payment.amount.value,
      currency: payment.amount.currency,
      description: payment.description,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      paid: payment.paid
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Status check failed: ' + error.message },
      { status: 500 }
    );
  }
}
