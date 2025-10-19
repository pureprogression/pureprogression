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

    // Убираем проверку минимальной суммы для простых Bitcoin переводов

    // Проверяем валюту
    const supportedCurrencies = ['USD', 'EUR'];
    if (!supportedCurrencies.includes(currency)) {
      return NextResponse.json(
        { error: 'Unsupported currency' },
        { status: 400 }
      );
    }

    // Проверяем наличие ключей
    if (!process.env.NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { error: 'NOWPayments configuration missing' },
        { status: 500 }
      );
    }

    // Создаем платеж через NOW Payments API
    const paymentData = {
      price_amount: amount,
      price_currency: currency,
      pay_currency: 'btc', // Bitcoin как основная криптовалюта
      order_id: `donation_${Date.now()}`,
      order_description: description,
      ipn_callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/nowpayments/webhook`,
      case: 'success'
    };

    const response = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`NOWPayments API error: ${JSON.stringify(errorData)}`);
    }

    const payment = await response.json();

    return NextResponse.json({
      success: true,
      paymentId: payment.payment_id,
      redirectUrl: payment.pay_address, // Bitcoin адрес для оплаты
      amount: amount,
      currency: currency,
      description: description,
      status: 'pending',
      paymentMethod: 'crypto',
      bitcoinAmount: payment.amount, // Точная сумма в Bitcoin
      paymentUrl: `https://nowpayments.io/payment/?iid=${payment.payment_id}`, // Ссылка на страницу оплаты
      expiresAt: payment.expiration_estimate_date // Время истечения
    });

  } catch (error) {
    console.error('NOWPayments creation error:', error);
    return NextResponse.json(
      { error: 'Payment creation failed: ' + error.message },
      { status: 500 }
    );
  }
}
