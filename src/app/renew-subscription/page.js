"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth, db, isAdmin } from "@/lib/firebase";
import { createSubscription } from "@/lib/payments";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { trackWorkoutCreated } from "@/lib/analytics";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { TEXTS } from "@/constants/texts";

const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Месячная подписка',
    nameEn: 'Monthly Subscription',
    price: 1,
    period: '1 месяц',
    periodEn: '1 month',
    description: 'Полный доступ ко всем функциям на 1 месяц',
    descriptionEn: 'Full access to all features for 1 month'
  },
  '3months': {
    name: 'Подписка на 3 месяца',
    nameEn: '3 Months Subscription',
    price: 1,
    period: '3 месяца',
    periodEn: '3 months',
    description: 'Экономия 16% при оплате за 3 месяца',
    descriptionEn: 'Save 16% when paying for 3 months',
    discount: '16%'
  },
  yearly: {
    name: 'Годовая подписка',
    nameEn: 'Yearly Subscription',
    price: 1,
    period: '1 год',
    periodEn: '1 year',
    description: 'Максимальная экономия - 30%',
    descriptionEn: 'Maximum savings - 30%',
    discount: '30%'
  }
};

export default function RenewSubscriptionPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, hasSubscription, subscription, isLoading: subscriptionLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('3months');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Устанавливаем текущий план по умолчанию
  useEffect(() => {
    if (subscription?.type) {
      setSelectedPlan(subscription.type);
    }
  }, [subscription]);

  // Редирект неавторизованных пользователей
  useEffect(() => {
    if (subscriptionLoading) return;
    
    if (!user) {
      router.replace('/auth?redirect=/renew-subscription');
      return;
    }

    // Если нет активной подписки - редиректим на обычную страницу подписок
    if (!hasSubscription && !isAdmin(user)) {
      router.replace('/subscribe');
    }
  }, [user, hasSubscription, subscriptionLoading, router]);

  const handleRenew = async () => {
    if (!user) {
      router.push('/auth?redirect=/renew-subscription');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const plan = SUBSCRIPTION_PLANS[selectedPlan];
      const paymentData = await createSubscription(user.uid, selectedPlan);
      
      // Сохраняем payment_id в localStorage для использования на странице success
      if (paymentData.paymentId) {
        localStorage.setItem('last_subscription_payment_id', paymentData.paymentId);
        localStorage.setItem('last_subscription_type', selectedPlan);
        localStorage.setItem('last_subscription_user_id', user.uid);
      }
      
      // Редирект на страницу оплаты Юкассы
      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      } else {
        throw new Error('No redirect URL received');
      }
    } catch (err) {
      console.error('Subscription renewal error:', err);
      setError(err.message || 'Ошибка при продлении подписки');
      setIsProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    let dateObj;
    if (date.toDate) {
      dateObj = date.toDate();
    } else if (date.seconds) {
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    return dateObj.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNewEndDate = () => {
    if (!subscription?.expiresAt) return null;
    
    let currentEndDate;
    if (subscription.expiresAt.toDate) {
      currentEndDate = subscription.expiresAt.toDate();
    } else if (subscription.expiresAt.seconds) {
      currentEndDate = new Date(subscription.expiresAt.seconds * 1000);
    } else if (typeof subscription.expiresAt === 'string') {
      currentEndDate = new Date(subscription.expiresAt);
    } else {
      currentEndDate = subscription.expiresAt;
    }

    const newEndDate = new Date(currentEndDate);
    switch (selectedPlan) {
      case 'monthly':
        newEndDate.setMonth(newEndDate.getMonth() + 1);
        break;
      case '3months':
        newEndDate.setMonth(newEndDate.getMonth() + 3);
        break;
      case 'yearly':
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        break;
    }
    
    return newEndDate;
  };

  if (isLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Перенаправление...</div>
      </div>
    );
  }

  if (!hasSubscription && !isAdmin(user)) {
    return null; // Редирект на /subscribe
  }

  const texts = TEXTS[language].subscription;
  const newEndDate = calculateNewEndDate();

  return (
    <>
      <Navigation currentPage="renew-subscription" user={user} />
      <div className="min-h-screen bg-black pt-20 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          {/* Заголовок */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-4">
              {language === 'en' ? 'Renew Subscription' : 'Продлить подписку'}
            </h1>
            <p className="text-white/60 text-base">
              {language === 'en' 
                ? 'Your remaining days will be added to the new subscription period'
                : 'Оставшиеся дни будут добавлены к новому периоду подписки'}
            </p>
          </motion.div>

          {/* Текущая подписка */}
          {subscription && (
            <motion.div
              className="bg-white/5 border border-green-500/50 rounded-xl p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-bold text-white mb-4">
                {language === 'en' ? 'Current Subscription' : 'Текущая подписка'}
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/60 text-sm">
                    {language === 'en' ? 'Expires on:' : 'Истекает:'}
                  </span>
                  <span className="text-white font-semibold">
                    {formatDate(subscription.expiresAt)}
                  </span>
                </div>
                {newEndDate && (
                  <div className="flex justify-between pt-2 border-t border-white/10">
                    <span className="text-green-400 text-sm font-medium">
                      {language === 'en' ? 'New expiration date:' : 'Новая дата окончания:'}
                    </span>
                    <span className="text-green-400 font-semibold">
                      {formatDate(newEndDate)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Планы подписки */}
          <div className="grid grid-cols-1 gap-4 mb-12 max-w-sm mx-auto">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
              <motion.div
                key={key}
                className={`relative cursor-pointer transition-all duration-300 ${
                  selectedPlan === key
                    ? 'scale-[1.02]'
                    : 'scale-100'
                }`}
                onClick={() => setSelectedPlan(key)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (key === 'monthly' ? 0 : key === '3months' ? 1 : 2) }}
                whileHover={{ scale: selectedPlan === key ? 1.02 : 1.01 }}
              >
                <div className={`relative bg-black/40 border rounded-xl p-4 overflow-hidden backdrop-blur-sm ${
                  selectedPlan === key
                    ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    : 'border-white/10'
                }`}>
                  {/* Градиентный фон при выборе */}
                  {selectedPlan === key && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/0 to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}

                  {/* Контент */}
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    {/* Левая часть: название и цена */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-base font-semibold truncate ${
                          selectedPlan === key ? 'text-white' : 'text-white/90'
                        }`}>
                          {language === 'en' ? plan.nameEn : plan.name}
                        </h3>
                        {plan.discount && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            selectedPlan === key
                              ? 'bg-green-500 text-white'
                              : 'bg-white/10 text-white/70'
                          }`}>
                            -{plan.discount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${
                          selectedPlan === key ? 'text-green-400' : 'text-white'
                        }`}>
                          {plan.price} ₽
                        </span>
                        <span className="text-white/50 text-xs">
                          / {language === 'en' ? plan.periodEn : plan.period}
                        </span>
                      </div>
                    </div>

                    {/* Правая часть: индикатор выбора */}
                    <div className="flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedPlan === key
                          ? 'border-green-500 bg-green-500'
                          : 'border-white/30'
                      }`}>
                        {selectedPlan === key && (
                          <motion.div
                            className="w-2.5 h-2.5 rounded-full bg-white"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Описание (компактно) */}
                  <p className="text-white/50 text-xs mt-2 line-clamp-1">
                    {language === 'en' ? plan.descriptionEn : plan.description}
                  </p>

                  {/* Декоративные элементы */}
                  {selectedPlan === key && (
                    <>
                      <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
                      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-green-500/10 rounded-full blur-xl" />
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Ошибка */}
          {error && (
            <motion.div
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          {/* Кнопка продления */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleRenew}
              disabled={isProcessing}
              className="w-full px-12 py-4 bg-green-500 text-white rounded-xl font-bold text-lg hover:bg-green-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing 
                ? (language === 'en' ? 'Processing...' : 'Обработка...')
                : (language === 'en' ? 'Renew Subscription' : 'Продлить подписку')
              }
            </button>
          </motion.div>

          {/* Дополнительная информация */}
          <motion.div
            className="text-center text-white/40 text-sm space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>
              {language === 'en'
                ? 'Payment is processed securely through YooKassa. Your subscription will be extended immediately after payment.'
                : 'Оплата обрабатывается безопасно через Юкассу. Ваша подписка будет продлена сразу после оплаты.'}
            </p>
            <p className="text-green-400/60">
              {language === 'en'
                ? '✓ Your remaining subscription days will be preserved and added to the new period'
                : '✓ Ваши оставшиеся дни подписки будут сохранены и добавлены к новому периоду'}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

