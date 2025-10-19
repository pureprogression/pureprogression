// Тест минимальных сумм для NOWPayments
const API_KEY = process.env.NOWPAYMENTS_API_KEY;

async function testMinimumAmounts() {
  const amounts = [50, 100, 200, 500, 1000]; // Тестируем разные суммы
  
  for (const amount of amounts) {
    try {
      console.log(`\nТестируем сумму: $${amount}`);
      
      const response = await fetch('https://api.nowpayments.io/v1/payment', {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: 'USD',
          pay_currency: 'btc',
          order_id: `test_${Date.now()}`,
          order_description: 'Test payment',
          case: 'success'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ $${amount} - РАБОТАЕТ!`);
        console.log(`Bitcoin сумма: ${data.amount} BTC`);
        break;
      } else {
        console.log(`❌ $${amount} - ОШИБКА:`, data.message);
      }
    } catch (error) {
      console.log(`❌ $${amount} - ОШИБКА:`, error.message);
    }
  }
}

testMinimumAmounts();
