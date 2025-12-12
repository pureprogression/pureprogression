"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { createSubscription } from "@/lib/payments";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const SUBSCRIPTION_PLANS = {
  monthly: {
    name: 'Месячная подписка',
    nameEn: 'Monthly Subscription',
    price: 990,
    period: '1 месяц',
    periodEn: '1 month',
    description: 'Полный доступ ко всем функциям на 1 месяц',
    descriptionEn: 'Full access to all features for 1 month'
  },
  '3months': {
    name: 'Подписка на 3 месяца',
    nameEn: '3 Months Subscription',
    price: 2490, // 830 руб/мес, экономия 16%
    period: '3 месяца',
    periodEn: '3 months',
    description: 'Экономия 16% при оплате за 3 месяца',
    descriptionEn: 'Save 16% when paying for 3 months',
    discount: '16%'
  },
  yearly: {
    name: 'Годовая подписка',
    nameEn: 'Yearly Subscription',
    price: 8290, // 691 руб/мес, экономия 30%
    period: '1 год',
    periodEn: '1 year',
    description: 'Максимальная экономия - 30%',
    descriptionEn: 'Maximum savings - 30%',
    discount: '30%'
  }
};

export default function SubscribePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
      
      if (!user) {
        router.push('/auth?redirect=/subscribe');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth?redirect=/subscribe');
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
      console.error('Subscription error:', err);
      setError(err.message || 'Ошибка при создании подписки');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navigation currentPage="subscribe" user={user} />
      <div className="min-h-screen bg-black pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Заголовок */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              {language === 'en' ? 'Choose Your Plan' : 'Выберите план подписки'}
            </h1>
            <p className="text-white/70 text-lg">
              {language === 'en' 
                ? 'Get full access to Workout Builder and My Workouts'
                : 'Получите полный доступ к Конструктору тренировок и Моим тренировкам'}
            </p>
          </motion.div>

          {/* Планы подписки */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
              <motion.div
                key={key}
                className={`relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                  selectedPlan === key
                    ? 'border-green-500 shadow-lg shadow-green-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onClick={() => setSelectedPlan(key)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * parseInt(key === 'monthly' ? 0 : key === '3months' ? 1 : 2) }}
              >
                {/* Скидка */}
                {plan.discount && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -{plan.discount}
                  </div>
                )}

                {/* Название плана */}
                <h3 className="text-xl font-bold text-white mb-2">
                  {language === 'en' ? plan.nameEn : plan.name}
                </h3>

                {/* Цена */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    {plan.price} ₽
                  </span>
                  <span className="text-white/60 text-sm ml-2">
                    / {language === 'en' ? plan.periodEn : plan.period}
                  </span>
                </div>

                {/* Описание */}
                <p className="text-white/70 text-sm mb-4">
                  {language === 'en' ? plan.descriptionEn : plan.description}
                </p>

                {/* Чекбокс выбора */}
                <div className="flex items-center justify-center mt-6">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === key
                      ? 'border-green-500 bg-green-500'
                      : 'border-white/40'
                  }`}>
                    {selectedPlan === key && (
                      <div className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Ошибка */}
          {error && (
            <motion.div
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 text-red-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          {/* Кнопка оплаты */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing 
                ? (language === 'en' ? 'Processing...' : 'Обработка...')
                : (language === 'en' ? 'Subscribe Now' : 'Оформить подписку')
              }
            </button>
          </motion.div>

          {/* Дополнительная информация */}
          <motion.div
            className="mt-12 text-center text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>
              {language === 'en'
                ? 'Payment is processed securely through YooKassa. Your subscription will be activated immediately after payment.'
                : 'Оплата обрабатывается безопасно через Юкассу. Ваша подписка будет активирована сразу после оплаты.'}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

