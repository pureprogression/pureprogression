import { NextResponse } from 'next/server';

/**
 * API endpoint для захвата (capture) платежа Юкассы
 * Используется для завершения платежа в двухстадийной схеме
 */
export async function POST(request) {
  try {
    const { paymentId } = await request.json();

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

    // Захватываем платеж через API Юкассы
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': `capture_${paymentId}_${Date.now()}`
      },
      body: JSON.stringify({}) // Пустое тело для capture
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Capture Payment] Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to capture payment', details: errorData },
        { status: response.status }
      );
    }

    const payment = await response.json();

    console.log(`[Capture Payment] Successfully captured payment ${paymentId}, new status: ${payment.status}`);

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      status: payment.status,
      paid: payment.paid,
      captured_at: payment.captured_at
    });

  } catch (error) {
    console.error('[Capture Payment] Error:', error);
    return NextResponse.json(
      { error: 'Failed to capture payment: ' + error.message },
      { status: 500 }
    );
  }
}

