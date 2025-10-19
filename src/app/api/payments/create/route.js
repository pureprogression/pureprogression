import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, currency, description } = await request.json();

    // Валидация
    if (!amount || !currency || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем валюту
    const supportedCurrencies = ['RUB', 'USD', 'EUR'];
    if (!supportedCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Unsupported currency' },
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

    // Создаем платеж через API ЮKassы
    const paymentData = {
      amount: {
        value: amount.toString(),
        currency: currency
      },
      confirmation: {
        type: 'redirect',
        return_url: process.env.NODE_ENV === 'production' 
          ? 'https://pure-progression.ru/payment/success'
          : 'http://localhost:3000/payment/success'
      },
      description: description,
      metadata: {
        order_id: `donation_${Date.now()}`
      },
      receipt: {
        customer: {
          email: 'donation@pure-progression.com'
        },
        items: [
          {
            description: description,
            amount: {
              value: amount.toString(),
              currency: currency
            },
            vat_code: 4, // Без НДС
            quantity: '1'
          }
        ]
      }
    };

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`YooKassa API error: ${JSON.stringify(errorData)}`);
    }

    const payment = await response.json();

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      redirectUrl: payment.confirmation.confirmation_url,
      amount: amount,
      currency: currency,
      description: description,
      status: 'pending'
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: 'Payment creation failed: ' + error.message },
      { status: 500 }
    );
  }
}
