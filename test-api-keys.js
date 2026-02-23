// Простой тест для проверки API ключей
// Запуск: node test-api-keys.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testGroqKey(key) {
  console.log('\n🧪 Тестирую Groq API...');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'user', content: 'Say "Hello" in JSON format: {"message": "Hello"}' }
        ],
        max_tokens: 20
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Groq API РАБОТАЕТ!');
      console.log('Ответ:', data.choices[0]?.message?.content);
      return true;
    } else {
      console.log('❌ Groq API ОШИБКА:', response.status, JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ Groq API ОШИБКА:', error.message);
    return false;
  }
}

async function testGeminiKey(key) {
  console.log('\n🧪 Тестирую Gemini API...');
  try {
    // Пробуем разные варианты моделей
    const models = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash'
    ];

    for (const model of models) {
      try {
        console.log(`  Пробую модель: ${model}...`);
        
        // Пробуем v1beta
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say "Hello"' }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Gemini API РАБОТАЕТ с моделью ${model}!`);
          console.log('Ответ:', data.candidates?.[0]?.content?.parts?.[0]?.text);
          return true;
        } else {
          const error = await response.text();
          console.log(`  ❌ ${model} (v1beta): ${response.status} - ${error.substring(0, 100)}`);
        }

        // Пробуем v1
        response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Say "Hello"' }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Gemini API РАБОТАЕТ с моделью ${model} (v1)!`);
          console.log('Ответ:', data.candidates?.[0]?.content?.parts?.[0]?.text);
          return true;
        } else {
          const error = await response.text();
          console.log(`  ❌ ${model} (v1): ${response.status} - ${error.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`  ❌ ${model} ошибка: ${error.message}`);
      }
    }

    console.log('❌ Ни одна модель Gemini не работает');
    return false;
  } catch (error) {
    console.log('❌ Gemini API ОШИБКА:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔑 Тестирование API ключей\n');
  console.log('Введите ключи для проверки (или нажмите Enter для пропуска):\n');

  rl.question('Groq API Key (начинается с gsk_): ', async (groqKey) => {
    if (groqKey.trim()) {
      await testGroqKey(groqKey);
    }

    rl.question('\nGemini API Key (начинается с AIzaSy): ', async (geminiKey) => {
      if (geminiKey.trim()) {
        await testGeminiKey(geminiKey);
      }

      console.log('\n✅ Тестирование завершено!');
      rl.close();
    });
  });
}

main();
