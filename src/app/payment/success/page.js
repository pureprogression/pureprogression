"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function PaymentSuccess() {
  const router = useRouter();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionActivated, setSubscriptionActivated] = useState(false);
  const [user, setUser] = useState(null);
  const [activationAttempts, setActivationAttempts] = useState(0);
  const [activationError, setActivationError] = useState(null);

  useEffect(() => {
    // Ждем авторизации пользователя
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        console.log('[Payment Success] User authenticated:', currentUser.uid);
        // После авторизации запускаем процесс активации
        initializeActivation(currentUser);
      } else {
        console.log('[Payment Success] User not authenticated yet, waiting...');
        setIsLoading(false);
      }
    });

    // Общий таймаут - если через 60 секунд ничего не произошло, показываем сообщение
    const overallTimeout = setTimeout(() => {
      // Проверяем, активирована ли подписка перед показом сообщения
      if (!subscriptionActivated) {
        console.log('[Payment Success] Overall timeout reached, but subscription may still be processing');
        setIsLoading(false);
        // Не показываем ошибку, просто убираем загрузку - подписка может активироваться через webhook
        setActivationError(null);
      }
    }, 60000); // 60 секунд (увеличено с 30)

    return () => {
      unsubscribe();
      clearTimeout(overallTimeout);
    };
  }, []);

  const initializeActivation = async (currentUser) => {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    let type = urlParams.get('type'); // 'subscription' или 'donation'
    
    // Пытаемся получить payment_id из разных источников
    let paymentId = urlParams.get('payment_id') || 
                   urlParams.get('paymentId') || 
                   urlParams.get('payment');
    
    // Если payment_id не в URL, берем из localStorage (сохранен при создании платежа)
    if (!paymentId) {
      paymentId = localStorage.getItem('last_subscription_payment_id');
      if (paymentId) {
        console.log('[Payment Success] Got payment ID from localStorage:', paymentId);
        // Если payment_id найден в localStorage, это скорее всего подписка
        if (!type) {
          type = 'subscription';
          console.log('[Payment Success] Detected subscription type from localStorage payment_id');
        }
      }
    }
    
    console.log('[Payment Success] URL params:', {
      payment_id: urlParams.get('payment_id'),
      paymentId: urlParams.get('paymentId'),
      payment: urlParams.get('payment'),
      type: type,
      paymentIdFromStorage: localStorage.getItem('last_subscription_payment_id'),
      allParams: Object.fromEntries(urlParams.entries())
    });
    
    // Если это подписка (или type не указан, но есть payment_id в localStorage), всегда пытаемся активировать через pendingPayments
    // Это работает даже если payment_id не найден, так как pendingPayments содержит все необработанные платежи
    if (type === 'subscription' || (!type && paymentId)) {
      console.log('[Payment Success] Type is subscription (or detected), attempting activation from pending payments...');
      // Сразу пытаемся активировать через pendingPayments (это самый надежный способ)
      attemptActivationFromPending(currentUser, 0).catch(error => {
        console.error('[Payment Success] Error in attemptActivationFromPending:', error);
        setIsLoading(false);
        setActivationError('Не удалось автоматически активировать подписку. Используйте кнопку ниже.');
      });
      
      // Если payment_id найден, также проверяем статус платежа (параллельно)
      if (paymentId) {
        console.log('[Payment Success] Found payment ID:', paymentId);
        // Проверяем статус платежа (это может активировать подписку быстрее)
        checkPaymentStatus(paymentId, type || 'subscription', currentUser);
      } else {
        console.log('[Payment Success] No payment ID found, relying on pendingPayments activation');
        // Если payment_id не найден, полагаемся только на pendingPayments
        // attemptActivationFromPending уже запущен выше
      }
    } else {
      // Для донаций просто проверяем статус, если payment_id есть
      if (paymentId) {
        checkPaymentStatus(paymentId, type || 'donation', currentUser);
      } else {
        setIsLoading(false);
      }
    }
  };

  const attemptActivationFromPending = async (currentUser, attemptNumber = 0) => {
    // Если подписка уже активирована, не пытаемся снова
    if (subscriptionActivated) {
      console.log('[Payment Success] Subscription already activated, skipping attempt');
      return;
    }

    if (attemptNumber >= 5) {
      console.log('[Payment Success] Max activation attempts reached');
      // Не показываем ошибку, если подписка уже активирована через другой метод
      if (!subscriptionActivated) {
        setActivationError('Не удалось активировать подписку автоматически. Используйте кнопку ниже.');
      }
      setIsLoading(false);
      return;
    }

    setActivationAttempts(attemptNumber + 1);
    console.log(`[Payment Success] Activation attempt ${attemptNumber + 1}/5 for user:`, currentUser.uid);
    
    try {
      console.log(`[Payment Success] Calling /api/subscription/activate-from-pending for user ${currentUser.uid}`);
      const response = await fetch('/api/subscription/activate-from-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.uid })
      });
      
      console.log(`[Payment Success] Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        // Если pending payment не найден, это может означать, что он уже обработан
        // Это не критичная ошибка, просто логируем
        if (response.status === 404 && errorData.error === 'No pending payments found') {
          console.log('[Payment Success] No pending payments found - may already be processed');
          // Проверяем, активирована ли подписка через другой метод
          // Если нет, пробуем еще раз (возможно, платеж еще обрабатывается)
          if (attemptNumber < 2) {
            setTimeout(() => {
              attemptActivationFromPending(currentUser, attemptNumber + 1);
            }, 2000);
          } else {
            // После 2 попыток останавливаемся, если нет pending payments
            setIsLoading(false);
            // Не показываем ошибку - подписка может активироваться через webhook
          }
          return;
        }
        
        // Если платеж не завершен (400), это нормально - просто пропускаем
        if (response.status === 400 && errorData.error === 'Payment not completed') {
          console.log('[Payment Success] Payment not completed yet, will skip this payment');
          // Пробуем еще раз через 3 секунды (может быть другой платеж уже завершен)
          if (attemptNumber < 2) {
            setTimeout(() => {
              attemptActivationFromPending(currentUser, attemptNumber + 1);
            }, 3000);
          } else {
            // После 2 попыток останавливаемся
            setIsLoading(false);
            // Не показываем ошибку - подписка может активироваться через webhook
          }
          return;
        }
        
        // Для других ошибок логируем, но не показываем пользователю
        console.log(`[Payment Success] API error (${response.status}):`, errorText);
        if (attemptNumber < 4) {
          // Пробуем еще раз
          setTimeout(() => {
            attemptActivationFromPending(currentUser, attemptNumber + 1);
          }, 3000);
        } else {
          // После всех попыток просто останавливаемся
          setIsLoading(false);
          // Не показываем ошибку - подписка может активироваться через webhook
        }
        return;
      }
      
      const data = await response.json();
      console.log('[Payment Success] Activation response:', data);
      
      if (response.ok && data.success) {
        console.log('✅ [Payment Success] Subscription activated from pending payment!');
        setSubscriptionActivated(true);
        setActivationError(null);
        setIsLoading(false);
        // Очищаем localStorage
        localStorage.removeItem('last_subscription_payment_id');
        localStorage.removeItem('last_subscription_type');
        localStorage.removeItem('last_subscription_user_id');
        // Не обновляем страницу сразу, показываем успех
        // setTimeout(() => {
        //   window.location.reload();
        // }, 1000);
        return; // Останавливаем дальнейшие попытки
      } else {
        console.log(`[Payment Success] Activation failed (attempt ${attemptNumber + 1}):`, data.error || data.message);
        // Пробуем еще раз через 3 секунды
        if (attemptNumber < 4) {
          setTimeout(() => {
            attemptActivationFromPending(currentUser, attemptNumber + 1);
          }, 3000);
        } else {
          // Не показываем ошибку - подписка может активироваться через webhook
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error(`[Payment Success] Error activating (attempt ${attemptNumber + 1}):`, error);
      // Пробуем еще раз через 3 секунды
      if (attemptNumber < 4) {
        setTimeout(() => {
          attemptActivationFromPending(currentUser, attemptNumber + 1);
        }, 3000);
      } else {
        // После всех попыток просто останавливаемся
        setIsLoading(false);
        // Не показываем ошибку - подписка может активироваться через webhook
      }
    }
  };

  const handleManualActivation = async () => {
    if (!user) {
      alert('Пожалуйста, войдите в систему');
      return;
    }

    setIsLoading(true);
    setActivationError(null);
    await attemptActivationFromPending(user, 0);
  };

  const activateSubscription = async (paymentId, subscriptionType, currentUser) => {
    if (!currentUser) {
      console.error('[Payment Success] User not authenticated');
      return false;
    }

    console.log('[Payment Success] Activating subscription:', {
      userId: currentUser.uid,
      paymentId,
      subscriptionType
    });

    try {
      const response = await fetch('/api/subscription/activate-from-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          paymentId: paymentId,
          subscriptionType: subscriptionType
        })
      });

      const data = await response.json();
      console.log('[Payment Success] Activation response:', data);
      
      if (response.ok && data.success) {
        setSubscriptionActivated(true);
        return true;
      } else {
        console.error('[Payment Success] Failed to activate subscription:', data.error);
        return false;
      }
    } catch (error) {
      console.error('[Payment Success] Error activating subscription:', error);
      return false;
    }
  };

  const checkPaymentStatus = async (paymentId, type, currentUser, retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 секунды
    
    try {
      console.log(`[Payment Success] Checking payment status for: ${paymentId}, type: ${type}, attempt: ${retryCount + 1}`);
      
      // Добавляем таймаут для запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут
      
      const response = await fetch(`/api/payments/status?paymentId=${paymentId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      console.log('[Payment Success] Payment status response:', data);
      
      if (response.ok) {
        setPaymentInfo(data);
        
        // Если это подписка, активируем подписку
        if (type === 'subscription') {
          console.log('[Payment Success] Type is subscription, checking payment status...', {
            status: data.status,
            paid: data.paid
          });
          
          // Если платеж в статусе waiting_for_capture, сразу пытаемся активировать через pendingPayments
          if (data.status === 'waiting_for_capture' && data.paid) {
            console.log('[Payment Success] Payment is waiting_for_capture, activating via pendingPayments (will auto-capture)...');
            if (currentUser) {
              await attemptActivationFromPending(currentUser, 0);
            }
            return;
          }
          
          // Если платеж успешен, активируем сразу
          if (data.status === 'succeeded' && data.paid) {
            console.log('[Payment Success] Payment succeeded, activating subscription...');
            
            // Получаем полную информацию о платеже через API
            const fullPaymentResponse = await fetch(`/api/payments/get-full?paymentId=${paymentId}`);
            
            if (fullPaymentResponse.ok) {
              const fullPayment = await fullPaymentResponse.json();
              console.log('[Payment Success] Full payment info:', fullPayment);
              
              const metadata = fullPayment.metadata || {};
              const subscriptionType = metadata.subscription_type || localStorage.getItem('last_subscription_type') || 'monthly';
              
              console.log('[Payment Success] Metadata:', metadata, 'Subscription type:', subscriptionType);
              
              // Активируем подписку сразу (webhook может не сработать)
              console.log('[Payment Success] Attempting to activate subscription immediately...');
              const activated = await activateSubscription(paymentId, subscriptionType, currentUser);
              if (activated) {
                console.log('✅ [Payment Success] Subscription activated successfully!');
                setSubscriptionActivated(true);
                setIsLoading(false);
                // Очищаем localStorage
                localStorage.removeItem('last_subscription_payment_id');
                localStorage.removeItem('last_subscription_type');
                localStorage.removeItem('last_subscription_user_id');
                // Не обновляем страницу, показываем успех
              } else {
                console.log('❌ [Payment Success] Failed to activate subscription, trying fallback via pendingPayments...');
                setIsLoading(false);
                // Пробуем через pendingPayments как резервный вариант
                if (currentUser) {
                  await attemptActivationFromPending(currentUser, 0);
                }
              }
            } else {
              console.log('[Payment Success] Failed to get full payment info, trying fallback via pendingPayments...');
              setIsLoading(false);
              // Пытаемся активировать с типом из localStorage или через pendingPayments
              if (currentUser) {
                await attemptActivationFromPending(currentUser, 0);
              }
            }
          } else {
            // Если платеж еще не завершен, ждем и проверяем снова (но не более MAX_RETRIES раз)
            if (retryCount < MAX_RETRIES) {
              console.log(`[Payment Success] Payment not completed yet, will retry in ${RETRY_DELAY}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
              setTimeout(() => {
                checkPaymentStatus(paymentId, type, currentUser, retryCount + 1);
              }, RETRY_DELAY);
            } else {
              console.log('[Payment Success] Max retries reached, trying activation via pendingPayments...');
              setIsLoading(false);
              // Пробуем активировать через pendingPayments как последний вариант
              if (currentUser && type === 'subscription') {
                await attemptActivationFromPending(currentUser, 0);
              }
            }
          }
        } else {
          setIsLoading(false);
        }
      } else {
        console.error('[Payment Success] Payment status check failed:', data);
        setIsLoading(false);
        // Если не удалось проверить статус, пробуем активировать через pendingPayments
        if (currentUser && type === 'subscription') {
          await attemptActivationFromPending(currentUser, 0);
        }
      }
    } catch (error) {
      console.error('[Payment Success] Error checking payment status:', error);
      setIsLoading(false);
      // Если ошибка при проверке, пробуем активировать через pendingPayments
      if (currentUser && type === 'subscription' && error.name !== 'AbortError') {
        console.log('[Payment Success] Trying activation via pendingPayments after error...');
        await attemptActivationFromPending(currentUser, 0);
      } else if (error.name === 'AbortError') {
        console.error('[Payment Success] Request timeout, showing manual activation option');
        setActivationError('Проверка платежа заняла слишком много времени. Используйте кнопку ниже для активации.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Проверка платежа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-8 text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Иконка успеха */}
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <span className="text-3xl">✓</span>
        </motion.div>

        {/* Заголовок */}
        <motion.h1
          className="text-2xl font-bold text-white mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {new URLSearchParams(window.location.search).get('type') === 'subscription' 
            ? 'Подписка активирована!' 
            : 'Спасибо за поддержку!'}
        </motion.h1>

        {/* Информация о платеже */}
        {paymentInfo && (
          <motion.div
            className="bg-white/10 rounded-xl p-4 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-white/80 text-sm mb-2">Сумма платежа:</p>
            <p className="text-2xl font-bold text-green-400">
              {paymentInfo.amount} {paymentInfo.currency}
            </p>
            <p className="text-white/60 text-sm mt-2">
              Статус: {paymentInfo.status === 'succeeded' ? 'Оплачено' : 'В обработке'}
            </p>
          </motion.div>
        )}

        {/* Описание */}
        <motion.p
          className="text-white/80 mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {new URLSearchParams(window.location.search).get('type') === 'subscription'
            ? (subscriptionActivated 
                ? 'Подписка успешно активирована!'
                : isLoading
                ? 'Обрабатываем вашу подписку...'
                : 'Подписка будет активирована автоматически.')
            : 'Ваша поддержка помогает нам развивать лучшую фитнес-платформу!'}
        </motion.p>

        {/* Индикатор попыток активации (только если еще не активирована и идет загрузка) */}
        {!subscriptionActivated && isLoading && new URLSearchParams(window.location.search).get('type') === 'subscription' && activationAttempts > 0 && (
          <motion.p
            className="text-white/60 text-sm mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            Активация подписки...
          </motion.p>
        )}

        {/* Кнопки */}
        <motion.div
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => router.push('/')}
            className="w-full p-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-bold hover:from-green-300 hover:to-emerald-400 transition-all duration-300"
          >
            Вернуться на главную
          </button>
          
          {new URLSearchParams(window.location.search).get('type') === 'subscription' && (
            <button
              onClick={() => router.push('/my-workouts')}
              className="w-full p-4 border-2 border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
            >
              Перейти к моим тренировкам
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
