// Конфигурация платежных систем

// ЮKassa (для России и СНГ)
export const YOOKASSA_CONFIG = {
  shopId: process.env.NEXT_PUBLIC_YOOKASSA_SHOP_ID || '',
  secretKey: process.env.NEXT_PUBLIC_YOOKASSA_SECRET_KEY || '',
  isTest: process.env.NODE_ENV === 'development',
  // Для продакшена нужно будет использовать серверные ключи
};

// Stripe (для международных платежей)
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  // Секретный ключ будет на сервере
};

// Валюты и их настройки
export const CURRENCY_CONFIG = {
  RUB: {
    symbol: '₽',
    amounts: [500, 1000, 2000, 5000, 10000],
    paymentSystem: 'yookassa',
    minAmount: 500,
    maxAmount: 100000
  },
  USD: {
    symbol: '$',
    amounts: [5, 10, 25, 50, 100],
    paymentSystem: 'nowpayments',
    minAmount: 1,
    maxAmount: 10000
  },
  EUR: {
    symbol: '€',
    amounts: [5, 10, 25, 50, 100],
    paymentSystem: 'nowpayments',
    minAmount: 1,
    maxAmount: 10000
  }
};

// Функция для создания платежа
export async function createPayment(amount, currency, description) {
  const currencyConfig = CURRENCY_CONFIG[currency];
  
  if (!currencyConfig) {
    throw new Error(`Unsupported currency: ${currency}`);
  }

  try {
    // Выбираем API endpoint в зависимости от валюты
    const apiEndpoint = currency === 'RUB' 
      ? '/api/payments/create'  // ЮKassa для RUB
      : '/api/payments/nowpayments'; // NOWPayments для USD/EUR

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        description: description
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Payment creation failed');
    }

    const paymentData = await response.json();
    return paymentData;

  } catch (error) {
    console.error('Payment creation error:', error);
    throw error;
  }
}

// Функция для проверки статуса платежа
export async function checkPaymentStatus(paymentId) {
  try {
    const response = await fetch(`/api/payments/status?paymentId=${paymentId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Status check failed');
    }

    const statusData = await response.json();
    return statusData;

  } catch (error) {
    console.error('Payment status check error:', error);
    throw error;
  }
}
