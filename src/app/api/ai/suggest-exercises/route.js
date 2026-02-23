import { NextResponse } from 'next/server';
import { exercises } from '@/data/exercises';

/**
 * API endpoint для получения рекомендаций упражнений от AI
 * 
 * Приоритет использования:
 * 1. Google Gemini API (лучшее качество, рекомендуется)
 *    - Получить ключ: https://aistudio.google.com/app/apikey
 *    - Работает из России без VPN
 * 2. Groq API (быстрая альтернатива)
 *    - Получить ключ: https://console.groq.com
 * 
 * Если Gemini доступен, используется он. Если нет - автоматически переключается на Groq.
 */
export async function POST(request) {
  try {
    const { userRequest, language = 'ru' } = await request.json();

    if (!userRequest) {
      return NextResponse.json(
        { error: 'User request is required' },
        { status: 400 }
      );
    }

    // Проверяем наличие API ключа (приоритет Hugging Face, затем Gemini, затем Groq)
    // Hugging Face - бесплатный tier, работает из России
    const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const groqApiKey = process.env.GROQ_API_KEY;
    
    // Диагностика для разработки - ВСЕГДА логируем
    console.log('[AI API] ===== Environment check =====');
    console.log('[AI API] hasHuggingFaceKey:', !!huggingFaceApiKey);
    console.log('[AI API] hasOpenRouterKey:', !!openRouterApiKey);
    console.log('[AI API] hasGeminiKey:', !!geminiApiKey);
    console.log('[AI API] hasGroqKey:', !!groqApiKey);
    if (huggingFaceApiKey) {
      console.log('[AI API] huggingFaceKeyLength:', huggingFaceApiKey.length);
      console.log('[AI API] huggingFaceKeyPrefix:', huggingFaceApiKey.substring(0, 10) + '...');
    }
    console.log('[AI API] ============================');
    
    if (!huggingFaceApiKey && !openRouterApiKey && !geminiApiKey && !groqApiKey) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please add HUGGINGFACE_API_KEY, OPENROUTER_API_KEY, GEMINI_API_KEY or GROQ_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    // Подготавливаем список упражнений для AI
    const exercisesList = exercises.map(ex => ({
      id: ex.id,
      title: language === 'en' ? (ex.titleEn || ex.title) : ex.title,
      muscleGroups: ex.muscleGroups || []
    }));

    // Определяем тип запроса: подбор упражнений или общий вопрос.
    // Важно: слово "тренировка" встречается в вопросах про питание/восстановление ("после тренировки"),
    // поэтому классифицируем "подбор упражнений" только по явным триггерам.
    const normalized = String(userRequest || '').toLowerCase();

    // Триггеры для общих вопросов (питание, восстановление, травмы)
    // Важно: исключаем "на спину/грудь/плечи" в контексте тренировки
    // Проверяем сначала, не является ли это запросом на тренировку для конкретной группы мышц
    const isWorkoutForMuscleGroup = /(составь|создай|сделай|подбери|тренировк).*на (спин|груд|плеч|руки|ноги|пресс|ягодиц)|на (спин|груд|плеч|руки|ноги|пресс|ягодиц).*(тренировк|упражнен)/.test(normalized);
    
    const nutritionOrGeneralTriggers = !isWorkoutForMuscleGroup && (
      /пита|еда|есть|куша|диет|калор|бжу|белк|жир|углев|протеин|креатин|добавк|витамин|омега|сон|восстанов|регенер|перетрен|травм|боль (в |в области |в районе )?(спин|колен|плеч)|пульс|давлен|отдых|отдыхать|сколько отдых|время отдых|перерыв|между подходами|между упражнениями|rest|recovery|rest time|break between|water|hydration|calor|diet|nutrition|protein|creatine|supplement|sleep|injur|pain/.test(normalized)
    );

    const exerciseSelectionTriggers =
      /подбери|подберите|подобрать|составь|составить|собери|собрать|програм(м|му)|план трениров|сплит|на ноги|на спину|на груд|на плеч|на руки|на пресс|на ягодиц|упражнен|комплекс|разминк|заминк|exercise|exercises|select|choose|suggest|recommend|workout plan|training plan|routine/.test(normalized);

    // Вопросительный формат без явного запроса на подбор упражнений — чаще "чат"
    const looksLikeQuestion =
      /[?？]/.test(normalized) || /^(как|почему|что такое|зачем|можно ли|нужно ли|сколько)\b/.test(normalized);

    // Если есть триггеры про отдых/восстановление/питание - это точно общий вопрос
    // Даже если есть слово "упражнений" или "тренировка"
    const isExerciseRequest = !nutritionOrGeneralTriggers && (
      exerciseSelectionTriggers || 
      (!looksLikeQuestion && /тренировк|workout|training|muscle|мышц|групп/.test(normalized) && !/отдых|восстанов|rest|recovery/.test(normalized))
    );

    // Интент "составь тренировку" может быть написан с ошибками (например, "тренирвку"),
    // поэтому определяем его не только по слову "тренировк", но и по глаголам ("составь/создай/сделай").
    const workoutIntent = /составь|составить|создай|создать|сделай|сделать|workout|program|routine/.test(normalized);
    const workoutHasDetails = /ноги|спин|груд|плеч|руки|пресс|ягодиц|для начинающих|продвинут|силов|кардио|выносливость|на массу|на похудение|legs|back|chest|shoulders|arms|abs|beginner|advanced|strength|cardio|endurance/.test(normalized);

    // Если пользователь просит "составь тренировку", но не указал деталей — отвечаем текстом уточняющих вопросов
    const shouldAskClarifying = isExerciseRequest && workoutIntent && !workoutHasDetails;

    // Для Hugging Face / Groq включаем жесткий JSON-режим только когда он реально нужен
    const shouldReturnJson = isExerciseRequest && !shouldAskClarifying;
    
    console.log('[AI API] Request classification:', {
      userRequest,
      normalized,
      nutritionOrGeneralTriggers,
      exerciseSelectionTriggers,
      looksLikeQuestion,
      isExerciseRequest,
      workoutIntent,
      workoutHasDetails,
      shouldAskClarifying,
      shouldReturnJson
    });
    
    // Создаем промпт для AI
    let prompt;
    
    if (isExerciseRequest) {
      // Запрос про упражнения - подбираем из базы и составляем тренировку
      if (shouldAskClarifying) {
        // Запрос слишком общий - отвечаем текстом с уточняющими вопросами
        prompt = `You are a helpful fitness trainer AI assistant. The user asked to create a workout, but the request is too general.

User request: "${userRequest}"

Your task:
- Respond in ${language === 'ru' ? 'Russian' : 'English'}
- Ask clarifying questions to understand what kind of workout they need
- Be friendly and helpful
- Don't return JSON, just text

Example questions to ask:
- What muscle groups do you want to train? (legs, back, chest, full body, etc.)
- What is your fitness level? (beginner, intermediate, advanced)
- What is your goal? (strength, endurance, weight loss, muscle gain, etc.)
- How much time do you have? (30 minutes, 1 hour, etc.)
- Do you have equipment? (bodyweight only, with equipment, etc.)

Respond with friendly clarifying questions:`;
      } else if (workoutIntent) {
        // Составляем полноценную тренировку
        prompt = `You are a fitness trainer AI assistant. You have access to a database of exercises.

Available exercises:
${JSON.stringify(exercisesList, null, 2)}

User request: "${userRequest}"

Your task:
1. Analyze the user's request and create a complete workout plan
2. Select 6-12 exercises that match the request
3. For each exercise, specify:
   - exerciseId: the ID from the available exercises list
   - sets: number of sets (typically 3-5)
   - reps: number of repetitions (typically 8-15, or "30-60 сек" for static holds)
   - rest: rest time between sets in seconds (typically 60-120)
4. Consider muscle groups, difficulty level, and user goals
5. Arrange exercises in a logical order (warm-up, main exercises, cool-down if needed)

IMPORTANT - Muscle group matching:
- "ноги" or "legs" = exercises with "legs" in muscleGroups array
- "спина" or "back" = exercises with "back" in muscleGroups array
- "грудь" or "chest" = exercises with "chest" in muscleGroups array
- "плечи" or "shoulders" = exercises with "shoulders" in muscleGroups array
- "руки" or "arms" = exercises with "arms" in muscleGroups array
- "пресс" or "abs" = exercises with "abs" in muscleGroups array
- If multiple groups mentioned, select exercises that match ANY of them

Return ONLY valid JSON in this format:
{
  "exerciseIds": ["4", "6", "8"],
  "workout": [
    {"exerciseId": "4", "sets": 3, "reps": 12, "rest": 90},
    {"exerciseId": "6", "sets": 4, "reps": 10, "rest": 120},
    {"exerciseId": "8", "sets": 3, "reps": 15, "rest": 60}
  ]
}

Important:
- Return ONLY valid JSON, no additional text
- Use only IDs from the available exercises list
- MUST select at least 6 exercises if available
- Sets: 3-5 for strength, 2-3 for endurance
- Reps: 8-12 for strength, 12-20 for endurance, "30-60 сек" for static holds
- Rest: 60-90 seconds for endurance, 90-120 for strength

Return the JSON:`;
      } else {
        // Просто подбираем упражнения
        prompt = `You are a fitness trainer AI assistant. You have access to a database of exercises.

Available exercises:
${JSON.stringify(exercisesList, null, 2)}

User request: "${userRequest}"

Your task:
1. Analyze the user's request
2. Select exercise IDs that match the request
3. Consider muscle groups, difficulty level, and user goals
4. Return a JSON object with an "exerciseIds" array

Important:
- Return ONLY valid JSON, no additional text
- Format: {"exerciseIds": ["4", "6", "8", "10"]}
- Select 5-15 exercises depending on the request
- Consider variety and balance
- Use only IDs from the available exercises list

Return the JSON:`;
      }
    } else {
      // Общий вопрос - отвечаем как ChatGPT
      prompt = `You are a helpful fitness trainer AI assistant. Answer the user's question in a friendly and informative way.

User question: "${userRequest}"

Instructions:
- Answer in ${language === 'ru' ? 'Russian' : 'English'}
- Be helpful, accurate, and concise
- If the question is about fitness, nutrition, or training, provide expert advice
- If you don't know something, admit it honestly
- Keep your response under 500 words
- Return ONLY plain text, NO JSON format, NO code blocks, NO structured data
- Write as if you're having a conversation

Answer:`;
    }

    let aiResponse = '';
    
    // Используем Hugging Face как основной вариант (бесплатный, работает из России)
    // Приоритет: Hugging Face > Gemini > Groq
    if (huggingFaceApiKey) {
      console.log('[AI API] Using Hugging Face Inference API (free tier)');
      const hfController = new AbortController();
      const hfTimeoutId = setTimeout(() => hfController.abort(), 30000);

      try {
        const cleanHfKey = huggingFaceApiKey.trim().replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
        
        console.log('[AI API] Making Hugging Face request...');
        
        // Используем правильный OpenAI-совместимый endpoint: /v1/chat/completions
        // Пробуем разные модели
        const models = [
          'mistralai/Mistral-7B-Instruct-v0.2',
          'google/gemma-7b-it',
          'meta-llama/Meta-Llama-3.1-8B-Instruct'
        ];

        let hfResponse = null;
        let hfData = null;

        for (const model of models) {
          try {
            console.log(`[AI API] Trying Hugging Face model: ${model}`);
            hfResponse = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${cleanHfKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  {
                    role: 'system',
                    content: shouldReturnJson
                      ? 'You are a fitness trainer AI. Return ONLY valid JSON. No additional text.'
                      : 'You are a helpful fitness trainer AI assistant. Return ONLY plain text (no JSON, no code blocks).'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: shouldReturnJson ? 500 : 1000,
                ...(shouldReturnJson ? { response_format: { type: 'json_object' } } : {})
              }),
              signal: hfController.signal
            });

            if (hfResponse.ok) {
              hfData = await hfResponse.json();
              console.log(`[AI API] Hugging Face model ${model} worked!`);
              break;
            } else {
              const errorText = await hfResponse.text();
              console.log(`[AI API] Model ${model} failed:`, hfResponse.status, errorText.substring(0, 200));
              hfResponse = null;
            }
          } catch (modelError) {
            console.log(`[AI API] Model ${model} error:`, modelError.message);
            hfResponse = null;
          }
        }

        if (!hfResponse || !hfResponse.ok) {
          throw new Error('All Hugging Face models failed. The API may have changed or models require access approval. Please check Hugging Face documentation.');
        }

        clearTimeout(hfTimeoutId);

        if (hfResponse && hfResponse.ok && hfData) {
          // Hugging Face Router использует OpenAI-совместимый формат
          aiResponse = hfData.choices?.[0]?.message?.content || '{}';
          console.log('[AI API] Hugging Face response received, aiResponse:', aiResponse.substring(0, 100));
        } else if (hfResponse) {
          let errorData;
          try {
            errorData = await hfResponse.json();
          } catch (e) {
            errorData = { message: await hfResponse.text() };
          }
          
          console.error('[AI API] Hugging Face error:', {
            status: hfResponse.status,
            error: errorData
          });
          
          if (hfResponse.status === 401 || hfResponse.status === 403) {
            throw new Error(`Invalid Hugging Face API key (${hfResponse.status}). Please check your HUGGINGFACE_API_KEY.`);
          } else if (hfResponse.status === 503) {
            // Модель загружается, нужно подождать
            throw new Error('Hugging Face model is loading. Please try again in a few seconds.');
          } else {
            const errorMsg = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
            throw new Error(`Hugging Face API error (${hfResponse.status}): ${errorMsg}`);
          }
        }
      } catch (hfError) {
        console.error('[AI API] Hugging Face error:', hfError.message || hfError);
        
        // Fallback на Gemini, если Hugging Face не работает
        if (geminiApiKey && !aiResponse) {
          console.log('[AI API] Hugging Face failed, trying Gemini as fallback...');
          // Продолжаем к коду Gemini ниже
        } else {
          throw hfError;
        }
      }
    }
    
    // Если Hugging Face не сработал или его нет, пробуем Gemini
    if (!aiResponse && geminiApiKey) {
      // Используем Gemini
      console.log('[AI API] Using Gemini API');
      const geminiController = new AbortController();
      const geminiTimeoutId = setTimeout(() => geminiController.abort(), 30000);

      try {
        const cleanGeminiKey = geminiApiKey.trim().replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
        
        console.log('[AI API] Key cleaning:', {
          originalLength: geminiApiKey.length,
          cleanedLength: cleanGeminiKey.length,
          originalPrefix: geminiApiKey.substring(0, 20),
          cleanedPrefix: cleanGeminiKey.substring(0, 20)
        });
        
        // Используем правильный endpoint: v1 (не v1beta)
        // Пробуем разные модели Gemini
        const models = [
          { name: 'gemini-1.5-flash', version: 'v1' },
          { name: 'gemini-1.5-pro', version: 'v1' },
          { name: 'gemini-pro', version: 'v1' }
        ];

        for (const { name, version } of models) {
          try {
            console.log(`[AI API] Trying Gemini model: ${name} (${version})`);
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent?key=${cleanGeminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                        text: `${shouldReturnJson
                          ? 'You are a fitness trainer AI. Return ONLY valid JSON. No additional text.'
                          : 'You are a helpful fitness trainer AI assistant. Return ONLY plain text (no JSON, no code blocks).'}\n\n${prompt}`
                  }]
                }],
                generationConfig: {
                  temperature: 0.7,
                      maxOutputTokens: shouldReturnJson ? 500 : 1000
                }
              }),
              signal: geminiController.signal
            });

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
              console.log(`[AI API] Gemini model ${name} worked!`);
              break;
            } else {
              const errorText = await geminiResponse.text();
              console.log(`[AI API] Gemini model ${name} failed:`, geminiResponse.status, errorText.substring(0, 200));
            }
          } catch (modelError) {
            console.log(`[AI API] Gemini model ${name} error:`, modelError.message);
          }
        }

        clearTimeout(geminiTimeoutId);

        if (!aiResponse) {
          // Если Gemini не работает, пробуем Groq как fallback
          if (groqApiKey) {
            console.log('[AI API] Gemini failed, trying Groq as fallback...');
            throw new Error('Gemini failed, trying Groq');
          } else {
            throw new Error('All Gemini models failed. Please check your GEMINI_API_KEY.');
          }
        }
      } catch (geminiError) {
        console.error('[AI API] Gemini API error:', geminiError.message || geminiError);
        
        // Fallback на Groq, если Gemini не работает
        if (groqApiKey && !aiResponse) {
          console.log('[AI API] Trying Groq as fallback...');
          // Продолжаем к коду Groq ниже
        } else {
          throw geminiError;
        }
      }
    }
    
    // Если Gemini не сработал или его нет, пробуем Groq
    if (!aiResponse && groqApiKey) {
      // Используем только Groq
      console.log('[AI API] Using Groq API');
      const groqController = new AbortController();
      const groqTimeoutId = setTimeout(() => groqController.abort(), 30000); // 30 секунд

      try {
        // Очищаем ключ от возможных пробелов и переносов строк
        let cleanGroqKey = groqApiKey.trim();
        // Убираем все пробелы, переносы строк и другие невидимые символы
        cleanGroqKey = cleanGroqKey.replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
        
        console.log('[AI API] Key cleaning:', {
          originalLength: groqApiKey.length,
          cleanedLength: cleanGroqKey.length,
          originalPrefix: groqApiKey.substring(0, 20),
          cleanedPrefix: cleanGroqKey.substring(0, 20),
          hasInvisibleChars: groqApiKey.length !== cleanGroqKey.length
        });
        
        if (!cleanGroqKey || cleanGroqKey.length < 10) {
          throw new Error('Invalid Groq API key format. Key seems too short or empty.');
        }

        // Проверяем, что ключ начинается с правильного префикса
        if (!cleanGroqKey.startsWith('gsk_')) {
          console.error('[AI API] ERROR: Groq API key does not start with "gsk_". Key prefix:', cleanGroqKey.substring(0, 20));
          throw new Error(`Invalid Groq API key format. Key must start with "gsk_". Found prefix: "${cleanGroqKey.substring(0, 10)}". Please check your GROQ_API_KEY in .env.local and on Vercel.`);
        }

        console.log('[AI API] Making Groq API request:', {
          keyLength: cleanGroqKey.length,
          keyPrefix: cleanGroqKey.substring(0, 10) + '...',
          hasCorrectPrefix: cleanGroqKey.startsWith('gsk_')
        });

        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cleanGroqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-70b-versatile',
            messages: [
              {
                role: 'system',
                content: shouldReturnJson
                  ? 'You are a helpful fitness trainer AI. Return ONLY valid JSON. No additional text.'
                  : 'You are a helpful fitness trainer AI assistant. Return ONLY plain text (no JSON, no code blocks).'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: shouldReturnJson ? 500 : 1000,
            ...(shouldReturnJson ? { response_format: { type: 'json_object' } } : {})
          }),
          signal: groqController.signal
        });

        clearTimeout(groqTimeoutId);

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          aiResponse = groqData.choices[0]?.message?.content || '{}';
        } else {
          let errorData;
          try {
            errorData = await groqResponse.json();
          } catch (e) {
            errorData = { message: await groqResponse.text() };
          }
          
          console.error('[AI API] Groq API error response:', {
            status: groqResponse.status,
            statusText: groqResponse.statusText,
            error: errorData,
            keyLength: cleanGroqKey.length,
            keyPrefix: cleanGroqKey.substring(0, 15) + '...',
            keyStartsWithGsk: cleanGroqKey.startsWith('gsk_')
          });
          
          if (groqResponse.status === 401 || groqResponse.status === 403) {
            const errorMsg = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
            throw new Error(`Invalid or expired API key (${groqResponse.status}). Your key may be expired, invalid, or blocked. Please create a new API key at https://console.groq.com and update GROQ_API_KEY. Error details: ${errorMsg}`);
          } else if (groqResponse.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          } else {
            const errorMsg = typeof errorData === 'object' ? JSON.stringify(errorData) : errorData;
            throw new Error(`Groq API error (${groqResponse.status}): ${errorMsg}`);
          }
        }
      } catch (groqError) {
        console.error('[AI API] Groq API error:', groqError.message || groqError);
        
        // Если Groq не работает, пробуем Gemini как fallback
        if (geminiApiKey && !aiResponse) {
          console.log('[AI API] Groq failed, trying Gemini as fallback...');
          try {
            const cleanGeminiKey = geminiApiKey.trim().replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
            
            // Используем правильный endpoint: v1 (не v1beta)
            const models = [
              { name: 'gemini-1.5-flash', version: 'v1' },
              { name: 'gemini-1.5-pro', version: 'v1' },
              { name: 'gemini-pro', version: 'v1' }
            ];

            for (const { name, version } of models) {
              try {
                console.log(`[AI API] Trying Gemini model: ${name} (${version})`);
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent?key=${cleanGeminiKey}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{
                      role: 'user',
                      parts: [{
                        text: `You are a fitness trainer AI. Return ONLY valid JSON: {"exerciseIds": ["id1", "id2", ...]}. No additional text.\n\n${prompt}`
                      }]
                    }],
                    generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 500
                    }
                  }),
                  signal: groqController.signal
                });

                if (geminiResponse.ok) {
                  const geminiData = await geminiResponse.json();
                  aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                  console.log(`[AI API] Gemini model ${name} worked!`);
                  break;
                } else {
                  const errorText = await geminiResponse.text();
                  console.log(`[AI API] Gemini model ${name} failed:`, geminiResponse.status, errorText.substring(0, 100));
                }
              } catch (modelError) {
                console.log(`[AI API] Gemini model ${name} error:`, modelError.message);
              }
            }

            if (!aiResponse) {
              throw new Error('All Gemini models failed. Groq error: ' + groqError.message);
            }
          } catch (geminiError) {
            console.error('[AI API] Gemini fallback also failed:', geminiError);
            throw groqError; // Пробрасываем оригинальную ошибку Groq
          }
        } else {
          throw groqError;
        }
      }
    } else if (geminiApiKey) {
      // Используем только Gemini, если Groq нет
      console.log('[AI API] Using Gemini API (only option)');
      const geminiController = new AbortController();
      const geminiTimeoutId = setTimeout(() => geminiController.abort(), 30000);

      try {
        const cleanGeminiKey = geminiApiKey.trim().replace(/\s+/g, '').replace(/\n/g, '').replace(/\r/g, '');
        
        // Используем правильный endpoint: v1 (не v1beta)
        const models = [
          { name: 'gemini-1.5-flash', version: 'v1' },
          { name: 'gemini-1.5-pro', version: 'v1' },
          { name: 'gemini-pro', version: 'v1' }
        ];

        for (const { name, version } of models) {
          try {
            console.log(`[AI API] Trying Gemini model: ${name} (${version})`);
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${name}:generateContent?key=${cleanGeminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `You are a fitness trainer AI. Return ONLY valid JSON: {"exerciseIds": ["id1", "id2", ...]}. No additional text.\n\n${prompt}`
                  }]
                }],
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 500
                }
              }),
              signal: geminiController.signal
            });

            if (geminiResponse.ok) {
              const geminiData = await geminiResponse.json();
              aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
              console.log(`[AI API] Gemini model ${name} worked!`);
              break;
            }
          } catch (modelError) {
            console.log(`[AI API] Gemini model ${name} error:`, modelError.message);
          }
        }

        clearTimeout(geminiTimeoutId);

        if (!aiResponse) {
          throw new Error('All Gemini models failed. Please check your GEMINI_API_KEY.');
        }
      } catch (geminiError) {
        console.error('[AI API] Gemini API error:', geminiError);
        throw geminiError;
      }
    } else {
      throw new Error('No AI API key configured. Please add HUGGINGFACE_API_KEY, GEMINI_API_KEY or GROQ_API_KEY to .env.local for AI Assistant to work.');
    }

    // Парсим ответ AI
    console.log('[AI API] Raw AI response:', aiResponse.substring(0, 200));
    console.log('[AI API] Is exercise request:', isExerciseRequest);

    // Если это запрос "составь тренировку" без деталей — возвращаем текст (даже если модель ошибочно вернула JSON)
    if (shouldAskClarifying) {
      let text = aiResponse.trim();
      // Иногда модель по инерции возвращает {"exerciseIds": []} — в этом случае отдаем свои уточняющие вопросы
      if (text.startsWith('{') || text.startsWith('[')) {
        const fallbackText = language === 'ru'
          ? [
              'Чтобы составить тренировку, уточните пожалуйста:',
              '1) Какие группы мышц? (ноги/спина/грудь/всё тело)',
              '2) Уровень? (новичок/средний/продвинутый)',
              '3) Цель? (сила/выносливость/похудение/масса)',
              '4) Сколько времени есть? (20/30/45/60 минут)',
              '5) Есть ли оборудование? (только вес тела/турник/гантели/резинки)',
            ].join('\n')
          : [
              'To create a workout, please clarify:',
              '1) Which muscle groups? (legs/back/chest/full body)',
              '2) Your level? (beginner/intermediate/advanced)',
              '3) Goal? (strength/endurance/weight loss/muscle gain)',
              '4) How much time do you have? (20/30/45/60 minutes)',
              '5) Equipment available? (bodyweight only/pull-up bar/dumbbells/bands)',
            ].join('\n');
        return NextResponse.json({ success: true, text: fallbackText, responseType: 'text' });
      }

      // Убираем возможные markdown code fences
      text = text.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, '')).trim();
      return NextResponse.json({ success: true, text, responseType: 'text' });
    }
    
    // Проверяем, не является ли ответ уточняющим вопросом (текстом, а не JSON)
    // Но только если это НЕ запрос на тренировку с деталями (например, "на спину")
    const isClarifyingQuestion = isExerciseRequest && !workoutHasDetails && (
      !aiResponse.trim().startsWith('{') && 
      !aiResponse.trim().startsWith('[') &&
      (aiResponse.length > 50 || /вопрос|уточн|какие|какой|какая|какое|what|which|how|when|уровень|цель|время|оборудование/i.test(aiResponse))
    );
    
    if (isClarifyingQuestion) {
      // AI задает уточняющие вопросы - возвращаем как текстовый ответ
      console.log('[AI API] AI is asking clarifying questions, returning as text');
      return NextResponse.json({
        success: true,
        text: aiResponse.trim(),
        responseType: 'text'
      });
    }
    
    // Если это запрос на тренировку с деталями, но AI вернул текст вместо JSON - пытаемся извлечь JSON
    if (isExerciseRequest && workoutHasDetails && !aiResponse.trim().startsWith('{') && !aiResponse.trim().startsWith('[')) {
      console.log('[AI API] AI returned text instead of JSON for workout request, trying to extract JSON...');
      // Пытаемся найти JSON в тексте
      const jsonMatch = aiResponse.match(/\{[\s\S]*"exerciseIds"[\s\S]*\}/);
      if (jsonMatch) {
        console.log('[AI API] Found JSON in text response');
        aiResponse = jsonMatch[0];
      } else {
        // Если JSON не найден, возвращаем ошибку
        console.error('[AI API] Could not extract JSON from AI response for workout request');
        return NextResponse.json({
          success: false,
          error: language === 'ru' 
            ? 'Не удалось подобрать упражнения по вашему запросу. Попробуйте уточнить запрос или использовать фильтры.'
            : 'Could not find exercises matching your request. Please try to be more specific or use filters.'
        }, { status: 200 });
      }
    }
    
    if (isExerciseRequest) {
      // Запрос про упражнения - парсим JSON с ID и workout структурой
      let exerciseIds = [];
      let workoutPlan = null;
      const isWorkoutRequest = /составь|создай|сделай|тренировк|программ|workout|program|routine/i.test(userRequest);
      
      try {
        const parsed = JSON.parse(aiResponse);
        console.log('[AI API] Parsed JSON:', parsed);
        
        if (parsed.workout && Array.isArray(parsed.workout)) {
          // Полная структура тренировки
          workoutPlan = parsed.workout;
          exerciseIds = parsed.workout.map(w => String(w.exerciseId));
          console.log('[AI API] Workout plan received:', workoutPlan.length, 'exercises');
        } else if (parsed.exerciseIds && Array.isArray(parsed.exerciseIds)) {
          // Просто список ID
          exerciseIds = parsed.exerciseIds;
        } else if (Array.isArray(parsed)) {
          exerciseIds = parsed;
        } else {
          console.warn('[AI API] Unexpected JSON structure:', parsed);
          // Пытаемся извлечь ID из других полей
          if (parsed.exercises && Array.isArray(parsed.exercises)) {
            exerciseIds = parsed.exercises.map(ex => String(ex.id || ex.exerciseId));
            console.log('[AI API] Extracted IDs from exercises array');
          }
        }
        console.log('[AI API] Extracted exercise IDs:', exerciseIds);
        console.log('[AI API] Available exercise IDs in database (sample):', exercises.slice(0, 20).map(ex => ({ id: ex.id, title: ex.title, groups: ex.muscleGroups })));
      } catch (parseError) {
        console.error('[AI API] Error parsing AI response:', parseError.message);
        console.error('[AI API] Response that failed to parse:', aiResponse);
        // Fallback: пытаемся извлечь массив из текста
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*"exerciseIds"[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            exerciseIds = parsed.exerciseIds || [];
            workoutPlan = parsed.workout || null;
            console.log('[AI API] Fallback parsing successful, IDs:', exerciseIds);
          }
        } catch (e) {
          console.error('[AI API] Fallback parsing also failed:', e);
          exerciseIds = [];
        }
      }

      // Получаем базовый URL для ассетов
      const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
      
      // Фильтруем упражнения по полученным ID и добавляем данные из workout
      // Нормализуем ID к строкам для сравнения
      const normalizedExerciseIds = exerciseIds.map(id => String(id));
      console.log('[AI API] Before filtering - exerciseIds:', exerciseIds, 'normalized:', normalizedExerciseIds.slice(0, 5));
      console.log('[AI API] Sample exercise IDs from database:', exercises.slice(0, 5).map(ex => ({ id: ex.id, type: typeof ex.id, stringId: String(ex.id) })));
      
      const filteredExercises = exercises.filter(ex => {
        const exerciseIdStr = String(ex.id);
        return normalizedExerciseIds.includes(exerciseIdStr);
      });
      
      console.log('[AI API] After filter - found', filteredExercises.length, 'exercises');
      
      const suggestedExercises = filteredExercises.map(ex => {
        try {
          // Заменяем template literal на реальный URL
          let videoUrl = ex.video;
          if (typeof videoUrl === 'string') {
            // Заменяем все вхождения template literal (на случай, если их несколько)
            if (videoUrl.includes('${ASSETS_BASE_URL}')) {
              videoUrl = videoUrl.replace(/\$\{ASSETS_BASE_URL\}/g, ASSETS_BASE_URL);
              console.log('[AI API] Replaced video URL template for exercise', ex.id, ':', videoUrl);
            } else if (!videoUrl.startsWith('http')) {
              // Если это относительный путь, добавляем базовый URL
              videoUrl = `${ASSETS_BASE_URL}${videoUrl.startsWith('/') ? '' : '/'}${videoUrl}`;
              console.log('[AI API] Added base URL to relative video path for exercise', ex.id, ':', videoUrl);
            }
          }
          
          let posterUrl = ex.poster;
          if (typeof posterUrl === 'string') {
            // Заменяем все вхождения template literal (на случай, если их несколько)
            if (posterUrl.includes('${ASSETS_BASE_URL}')) {
              posterUrl = posterUrl.replace(/\$\{ASSETS_BASE_URL\}/g, ASSETS_BASE_URL);
              console.log('[AI API] Replaced poster URL template for exercise', ex.id, ':', posterUrl);
            } else if (!posterUrl.startsWith('http')) {
              // Если это относительный путь, добавляем базовый URL
              posterUrl = `${ASSETS_BASE_URL}${posterUrl.startsWith('/') ? '' : '/'}${posterUrl}`;
              console.log('[AI API] Added base URL to relative poster path for exercise', ex.id, ':', posterUrl);
            }
          }
          
          const exerciseData = {
            ...ex,
            video: videoUrl,
            poster: posterUrl
          };
          
          // Если есть workout план, добавляем подходы/повторения/отдых
          if (workoutPlan) {
            const workoutItem = workoutPlan.find(w => String(w.exerciseId) === String(ex.id));
            if (workoutItem) {
              return {
                ...exerciseData,
                sets: workoutItem.sets || 3,
                reps: workoutItem.reps || 12,
                rest: workoutItem.rest || 60
              };
            }
          }
          return exerciseData;
        } catch (error) {
          console.error('[AI API] Error processing exercise', ex.id, ':', error);
          // Возвращаем упражнение как есть, если обработка не удалась
          return ex;
        }
      });
      
      console.log('[AI API] After filtering - found exercises:', suggestedExercises.length);
      console.log('[AI API] Filtered exercises:', {
        exerciseIdsCount: exerciseIds.length,
        foundExercisesCount: suggestedExercises.length,
        exerciseIds: exerciseIds.slice(0, 5),
        foundExerciseIds: suggestedExercises.slice(0, 5).map(ex => ex.id),
        firstExercise: suggestedExercises[0] ? {
          id: suggestedExercises[0].id,
          title: suggestedExercises[0].title,
          hasVideo: !!suggestedExercises[0].video,
          video: suggestedExercises[0].video,
          videoType: typeof suggestedExercises[0].video,
          videoIncludesTemplate: suggestedExercises[0].video?.includes?.('${ASSETS_BASE_URL}'),
          hasPoster: !!suggestedExercises[0].poster,
          poster: suggestedExercises[0].poster
        } : null,
        sampleExercises: suggestedExercises.slice(0, 3).map(ex => ({
          id: ex.id,
          video: ex.video,
          poster: ex.poster
        }))
      });

      // Если упражнений не найдено, возвращаем ошибку с деталями
      if (suggestedExercises.length === 0) {
        console.log('[AI API] No exercises found, returning error');
        console.log('[AI API] Debug info:', {
          exerciseIds: exerciseIds,
          exerciseIdsCount: exerciseIds.length,
          availableExerciseIds: exercises.slice(0, 10).map(ex => ex.id),
          totalExercises: exercises.length,
          aiResponse: aiResponse.substring(0, 500)
        });
        return NextResponse.json({
          success: false,
          error: language === 'ru' 
            ? 'Не удалось подобрать упражнения по вашему запросу. Попробуйте уточнить запрос или использовать фильтры.'
            : 'Could not find exercises matching your request. Please try to be more specific or use filters.'
        }, { status: 200 });
      }

      console.log('[AI API] Returning success response with', suggestedExercises.length, 'exercises');
      return NextResponse.json({
        success: true,
        exercises: suggestedExercises,
        message: language === 'ru' 
          ? `Подобрано ${suggestedExercises.length} упражнений`
          : `Found ${suggestedExercises.length} exercises`,
        responseType: 'exercises'
      });
    } else {
      // Общий вопрос - возвращаем текстовый ответ
      // Очищаем ответ от JSON структур, если они есть
      let cleanText = aiResponse.trim();
      
      // Если ответ начинается с JSON, пытаемся извлечь текстовую часть
      if (cleanText.startsWith('{') || cleanText.startsWith('[')) {
        try {
          const parsed = JSON.parse(cleanText);
          // Если это JSON, пытаемся извлечь текстовое содержимое
          if (parsed.response?.info?.description) {
            cleanText = parsed.response.info.description;
            // Добавляем ключевые пункты, если есть
            if (parsed.response?.keyPoints && Array.isArray(parsed.response.keyPoints)) {
              cleanText += '\n\n';
              parsed.response.keyPoints.forEach((point, idx) => {
                if (typeof point === 'object' && point.point) {
                  cleanText += `\n${idx + 1}. ${point.point}`;
                  if (point.details) {
                    if (typeof point.details === 'string') {
                      cleanText += `: ${point.details}`;
                    } else if (typeof point.details === 'object') {
                      if (point.details.why) cleanText += ` - ${point.details.why}`;
                      if (point.details.source) cleanText += `\n   Источники: ${point.details.source}`;
                    }
                  }
                }
              });
            }
          } else if (parsed.description) {
            cleanText = parsed.description;
          } else if (parsed.text) {
            cleanText = parsed.text;
          } else if (parsed.answer) {
            cleanText = parsed.answer;
          } else {
            // Если не можем извлечь текст, конвертируем JSON в читаемый текст
            cleanText = JSON.stringify(parsed, null, 2);
          }
        } catch (e) {
          // Если не JSON, оставляем как есть
          console.log('[AI API] Response is not valid JSON, using as-is');
        }
      }
      
      // Убираем markdown код блоки, если есть
      cleanText = cleanText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      console.log('[AI API] Returning text response, length:', cleanText.length);
      return NextResponse.json({
        success: true,
        text: cleanText,
        responseType: 'text'
      });
    }

  } catch (error) {
    console.error('[AI API] AI suggestion error:', error);
    console.error('[AI API] Error stack:', error.stack);
    console.error('[AI API] Error message:', error.message);
    
    // Более детальные сообщения об ошибках
    let errorMessage = error.message || 'Unknown error';
    
    if (error.message?.includes('aborted') || error.name === 'AbortError') {
      errorMessage = 'Request timeout. Please try again.';
    } else if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.message?.includes('API key') || error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('Invalid')) {
      errorMessage = error.message; // Используем оригинальное сообщение, которое уже содержит детали
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack,
          name: error.name
        } : undefined
      },
      { status: 500 }
    );
  }
}
