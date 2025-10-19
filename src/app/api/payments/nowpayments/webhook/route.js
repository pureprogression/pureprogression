import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('NOWPayments webhook received:', body);
    
    // Проверяем статус платежа
    const { payment_id, payment_status, pay_address, actually_paid } = body;
    
    if (payment_status === 'finished' || payment_status === 'partially_paid') {
      // Платеж успешно завершен
      console.log(`Payment ${payment_id} completed: ${actually_paid} BTC received`);
      
      // Здесь можно:
      // 1. Отправить уведомление пользователю
      // 2. Записать в базу данных
      // 3. Отправить email
      // 4. Обновить статус в системе
      
      // TODO: Добавить логику обработки успешного платежа
      
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      // Платеж не удался
      console.log(`Payment ${payment_id} failed: ${payment_status}`);
      
      // TODO: Добавить логику обработки неудачного платежа
    }
    
    return NextResponse.json({ status: 'ok' });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
