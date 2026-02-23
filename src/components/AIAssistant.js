"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { getExerciseTitle } from "@/data/exercises";

// Компонент для маленького видео превью упражнения
const ExerciseVideoPreview = ({ exercise }) => {
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !exercise?.video) {
      console.log('[ExerciseVideoPreview] Missing video or exercise:', { hasVideo: !!video, hasExercise: !!exercise, hasVideoUrl: !!exercise?.video });
      return;
    }
    
    // Получаем правильный URL видео (должен быть уже обработан на сервере)
    let videoUrl = exercise.video;
    
    // Если все еще есть template literal, заменяем (на всякий случай)
    if (typeof videoUrl === 'string' && videoUrl.includes('${ASSETS_BASE_URL}')) {
      const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
      videoUrl = videoUrl.replace('${ASSETS_BASE_URL}', ASSETS_BASE_URL);
      console.log('[ExerciseVideoPreview] Resolved video URL from template:', videoUrl);
    }
    
    console.log('[ExerciseVideoPreview] Setting up video for exercise:', exercise.id, videoUrl);
    console.log('[ExerciseVideoPreview] Exercise data:', {
      id: exercise.id,
      hasVideo: !!exercise.video,
      originalVideo: exercise.video,
      videoUrl: videoUrl,
      videoType: typeof videoUrl,
      videoUrlLength: videoUrl?.length,
      videoUrlStartsWithHttp: videoUrl?.startsWith?.('http'),
      hasPoster: !!exercise.poster,
      poster: exercise.poster
    });

    // Загружаем видео
    if (!video.src && videoUrl) {
      video.src = videoUrl;
      video.preload = 'metadata';
      video.load();
    }

    const handleCanPlay = () => {
      console.log('[ExerciseVideoPreview] Video can play:', exercise.id);
      setIsVideoReady(true);
      if (video.paused) {
        video.play().catch((err) => {
          console.error('[ExerciseVideoPreview] Play error:', err);
        });
      }
    };
    
    const handleError = (e) => {
      const error = e.target?.error;
      console.error('[ExerciseVideoPreview] Video error:', exercise.id, {
        errorCode: error?.code,
        errorMessage: error?.message,
        videoSrc: video?.src,
        videoUrl: videoUrl,
        exerciseVideo: exercise?.video
      });
      setHasError(true);
      setIsVideoReady(false);
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.addEventListener('error', handleError);

    // IntersectionObserver для паузы невидимых видео
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (video.paused && video.readyState >= 2) {
              video.play().catch(() => {});
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      observer.disconnect();
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    };
  }, [exercise?.video, exercise?.id]);

  if (hasError || !exercise?.video) {
    // Fallback: показываем заглушку с названием и постером, если видео не загружается
    return (
      <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
        {exercise?.poster ? (
          <img 
            src={exercise.poster} 
            alt={exercise?.title || 'Exercise'}
            className="w-full h-full object-cover opacity-50"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-white text-xs text-center p-2 line-clamp-2">
            {exercise?.title || 'No video'}
          </div>
        </div>
      </div>
    );
  }

  // Получаем правильный URL видео (дублируем логику из useEffect для рендера)
  let videoUrl = exercise?.video;
  if (typeof videoUrl === 'string' && videoUrl.includes('${ASSETS_BASE_URL}')) {
    const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
    videoUrl = videoUrl.replace('${ASSETS_BASE_URL}', ASSETS_BASE_URL);
  }
  
  let posterUrl = exercise?.poster;
  if (typeof posterUrl === 'string' && posterUrl.includes('${ASSETS_BASE_URL}')) {
    const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";
    posterUrl = posterUrl.replace('${ASSETS_BASE_URL}', ASSETS_BASE_URL);
  }

  return (
    <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-black/20">
      {/* Показываем постер, пока видео загружается или если есть ошибка */}
      {posterUrl && (
        <img 
          src={posterUrl} 
          alt={exercise?.title || 'Exercise'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${isVideoReady ? 'opacity-0' : 'opacity-100'}`}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        style={{ opacity: isVideoReady ? 1 : 0, transition: 'opacity 0.3s' }}
      />
      {!isVideoReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default function AIAssistant({ onAddExercises, exercises: allExercises }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedExercises, setSuggestedExercises] = useState([]);
  const messagesEndRef = useRef(null);
  const { language } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Убрали приветственное сообщение - подсказка теперь в placeholder

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Сохраняем значение перед очисткой
    const requestText = inputValue.trim();

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: requestText
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      console.log('[AIAssistant] Sending request:', { userRequest: requestText, language });
      
      // Создаем AbortController для таймаута
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 секунд таймаут
      
      // Все запросы идут через серверный API (безопасно для продакшена)
      const response = await fetch('/api/ai/suggest-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userRequest: requestText,
          language: language
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('[AIAssistant] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() || 'Unknown error' };
        }
        
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Failed to get AI recommendations`;
        console.error('[AIAssistant] API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      console.log('[AIAssistant] Response data:', {
        success: data.success,
        responseType: data.responseType,
        exercisesCount: data.exercises?.length,
        hasExercises: !!data.exercises,
        hasText: !!data.text,
        error: data.error,
        message: data.message
      });

      if (data.success) {
        if (data.responseType === 'exercises' && data.exercises && data.exercises.length > 0) {
          // Ответ с упражнениями
          const validExercises = data.exercises.filter(ex => ex && ex.id);
          console.log('[AIAssistant] Valid exercises:', validExercises.length);
          console.log('[AIAssistant] First exercise sample:', validExercises[0] ? {
            id: validExercises[0].id,
            hasVideo: !!validExercises[0].video,
            hasPoster: !!validExercises[0].poster,
            video: validExercises[0].video,
            poster: validExercises[0].poster,
            title: validExercises[0].title
          } : 'none');
          
          if (validExercises.length === 0) {
            throw new Error('No valid exercises received from API');
          }
          
          const assistantMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            text: data.message || (language === 'ru' 
              ? `Подобрано ${validExercises.length} упражнений:`
              : `Found ${validExercises.length} exercises:`)
          };

          setMessages(prev => [...prev, assistantMessage]);
          setSuggestedExercises(validExercises);
        } else if (data.responseType === 'text' && data.text) {
          // Текстовый ответ (как ChatGPT)
          const assistantMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            text: data.text
          };
          setMessages(prev => [...prev, assistantMessage]);
          setSuggestedExercises([]);
        } else {
          // Неожиданный формат ответа
          const errorText = data.error || data.message || (language === 'ru'
            ? 'Извините, не удалось обработать запрос. Попробуйте еще раз.'
            : 'Sorry, I couldn\'t process your request. Please try again.');
          
          const errorMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            text: errorText
          };
          setMessages(prev => [...prev, errorMessage]);
          setSuggestedExercises([]);
        }
      } else {
        const errorText = data.error || data.message || (language === 'ru'
          ? 'Извините, не удалось подобрать упражнения. Попробуйте описать запрос по-другому. Убедитесь, что указали группу мышц или цель тренировки.'
          : 'Sorry, I couldn\'t find exercises. Please try describing your request differently. Make sure to specify muscle groups or workout goals.');
        
        const errorMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          text: errorText
        };
        setMessages(prev => [...prev, errorMessage]);
        setSuggestedExercises([]);
      }
    } catch (error) {
      console.error('[AIAssistant] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      
      let errorText = language === 'ru'
        ? 'Произошла ошибка. Попробуйте еще раз.'
        : 'An error occurred. Please try again.';
      
      // Более конкретные сообщения об ошибках
      if (error.message?.includes('AI service is not configured') || error.message?.includes('No AI API key')) {
        errorText = language === 'ru'
          ? 'AI сервис временно недоступен. Используйте фильтры и поиск для подбора упражнений.'
          : 'AI service is temporarily unavailable. Please use filters and search to find exercises.';
      } else if (error.message?.includes('All Hugging Face') || error.message?.includes('All Gemini') || error.message?.includes('All models failed')) {
        errorText = language === 'ru'
          ? 'AI сервис временно недоступен. Все API сервисы не отвечают. Используйте фильтры и поиск для подбора упражнений.'
          : 'AI service is temporarily unavailable. All API services are not responding. Please use filters and search to find exercises.';
      } else if (error.message?.includes('Invalid API key') || error.message?.includes('Invalid or expired') || error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorText = language === 'ru'
          ? 'AI сервис временно недоступен из-за проблем с API ключами. Используйте фильтры и поиск для подбора упражнений.'
          : 'AI service is temporarily unavailable due to API key issues. Please use filters and search to find exercises.';
      } else if (error.message?.includes('timeout') || error.message?.includes('aborted') || error.name === 'AbortError') {
        errorText = language === 'ru'
          ? 'Превышено время ожидания. Попробуйте еще раз.'
          : 'Request timeout. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch failed')) {
        errorText = language === 'ru'
          ? 'Ошибка сети. Проверьте подключение к интернету и попробуйте еще раз.'
          : 'Network error. Check your internet connection and try again.';
      } else if (error.message?.includes('Failed to get AI recommendations') || error.message?.includes('HTTP')) {
        errorText = language === 'ru'
          ? `Ошибка API: ${error.message}. Проверьте настройки API ключей в .env.local и перезапустите сервер.`
          : `API error: ${error.message}. Please check your API keys in .env.local and restart the server.`;
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: errorText
      };
      setMessages(prev => [...prev, errorMessage]);
      setSuggestedExercises([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExercises = () => {
    if (suggestedExercises.length > 0 && onAddExercises) {
      onAddExercises(suggestedExercises);
      setSuggestedExercises([]);
      const successMessage = {
        id: Date.now(),
        type: 'assistant',
        text: language === 'ru'
          ? `Добавлено ${suggestedExercises.length} упражнений в тренировку!`
          : `Added ${suggestedExercises.length} exercises to your workout!`
      };
      setMessages(prev => [...prev, successMessage]);
    }
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      {/* Header - по центру */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white">
          {language === 'ru' ? 'AI Ассистент' : 'AI Assistant'}
        </h2>
      </div>

      {/* Messages - без иконок, показываем только если есть сообщения */}
      {messages.length > 0 && (
        <div className="space-y-4 mb-6 min-h-[200px] max-h-[400px] overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 text-white rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Exercises */}
          {suggestedExercises.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-white/5 rounded-2xl px-4 py-3 max-w-[80%] w-full">
                <p className="text-sm text-white mb-3">
                  {language === 'ru' ? 'Подобранные упражнения:' : 'Suggested exercises:'}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {suggestedExercises.map((exercise) => {
                    console.log('[AIAssistant] Rendering exercise:', exercise.id, {
                      hasVideo: !!exercise.video,
                      video: exercise.video,
                      videoType: typeof exercise.video,
                      videoLength: exercise.video?.length,
                      videoIncludesTemplate: exercise.video?.includes?.('${ASSETS_BASE_URL}'),
                      hasPoster: !!exercise.poster,
                      poster: exercise.poster,
                      title: exercise.title
                    });
                    return (
                      <div
                        key={exercise.id}
                        className="relative group"
                      >
                        <ExerciseVideoPreview exercise={exercise} />
                        {/* Название упражнения при наведении */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-2 pointer-events-none">
                          <div className="text-xs text-white text-center">
                            <p className="line-clamp-2 mb-1">
                              {getExerciseTitle(exercise, language)}
                            </p>
                            {(exercise.sets || exercise.reps) && (
                              <p className="text-white/80 text-[10px]">
                                {exercise.sets && `${exercise.sets}×`}
                                {exercise.reps && (typeof exercise.reps === 'string' ? exercise.reps : `${exercise.reps}`)}
                                {exercise.rest && ` • ${exercise.rest}с отдых`}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Название всегда видно внизу */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 rounded-b-lg">
                          <p className="text-[10px] text-white text-center line-clamp-1">
                            {getExerciseTitle(exercise, language)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Информация о тренировке, если есть */}
                {suggestedExercises.some(ex => ex.sets || ex.reps) && (
                  <div className="mb-3 p-2 bg-white/5 rounded-lg">
                    <p className="text-xs text-white/80 mb-2">
                      {language === 'ru' ? 'План тренировки:' : 'Workout plan:'}
                    </p>
                    <div className="space-y-1">
                      {suggestedExercises.map((exercise, idx) => (
                        <div key={exercise.id} className="text-xs text-white/70 flex justify-between">
                          <span>{idx + 1}. {getExerciseTitle(exercise, language)}</span>
                          {exercise.sets && exercise.reps && (
                            <span className="ml-2">
                              {exercise.sets}×{typeof exercise.reps === 'string' ? exercise.reps : exercise.reps}
                              {exercise.rest && ` • отдых ${exercise.rest}с`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={handleAddExercises}
                  className="w-full bg-white text-black py-2 px-4 rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm"
                >
                  {language === 'ru' 
                    ? `Добавить ${suggestedExercises.length} упражнений в тренировку`
                    : `Add ${suggestedExercises.length} exercises to workout`}
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input - большое окно с placeholder */}
      <div className="relative">
        <div className="flex items-end gap-2 bg-white/5 rounded-2xl border border-white/10 p-4 focus-within:border-white/20 transition-colors">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={language === 'ru' 
              ? 'Опишите желаемую тренировку. Например: "Тренировка на ноги для начинающих" или "Верх тела, 30 минут"'
              : 'Describe your desired workout. For example: "Leg workout for beginners" or "Upper body, 30 minutes"'}
            className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none resize-none text-sm leading-relaxed"
            rows={4}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
