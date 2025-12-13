"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { TEXTS } from "@/constants/texts";

const SUBSCRIPTION_TYPES = {
  monthly: {
    name: 'Месячная подписка',
    nameEn: 'Monthly Subscription',
  },
  '3months': {
    name: 'Подписка на 3 месяца',
    nameEn: '3 Months Subscription',
  },
  yearly: {
    name: 'Годовая подписка',
    nameEn: 'Yearly Subscription',
  }
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, hasSubscription, subscription, isLoading } = useSubscription();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth?redirect=/subscription');
    }
  }, [user, isLoading, router]);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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

  const subscriptionType = subscription?.type || 'monthly';
  const subscriptionInfo = SUBSCRIPTION_TYPES[subscriptionType] || SUBSCRIPTION_TYPES.monthly;

  return (
    <>
      <Navigation currentPage="subscription" user={user} />
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
              {language === 'en' ? 'Subscription Management' : 'Управление подпиской'}
            </h1>
          </motion.div>

          {/* Статус подписки */}
          {hasSubscription && subscription ? (
            <motion.div
              className="bg-white/5 border border-green-500/50 rounded-xl p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'en' ? 'Active Subscription' : 'Активная подписка'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">
                    {language === 'en' ? 'Subscription Type' : 'Тип подписки'}
                  </p>
                  <p className="text-white font-semibold">
                    {language === 'en' ? subscriptionInfo.nameEn : subscriptionInfo.name}
                  </p>
                </div>

                {subscription.expiresAt && (
                  <div>
                    <p className="text-white/60 text-sm mb-1">
                      {language === 'en' ? 'Expires On' : 'Действует до'}
                    </p>
                    <p className="text-white font-semibold">
                      {formatDate(subscription.expiresAt)}
                    </p>
                  </div>
                )}

                {subscription.startDate && (
                  <div>
                    <p className="text-white/60 text-sm mb-1">
                      {language === 'en' ? 'Started On' : 'Начало подписки'}
                    </p>
                    <p className="text-white font-semibold">
                      {formatDate(subscription.startDate)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="bg-white/5 border border-white/20 rounded-xl p-6 mb-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-white/60 mb-4">
                {language === 'en' 
                  ? 'You don\'t have an active subscription'
                  : 'У вас нет активной подписки'}
              </p>
              <button
                onClick={() => router.push('/subscribe')}
                className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-400 transition-all"
              >
                {language === 'en' ? 'Subscribe Now' : 'Оформить подписку'}
              </button>
            </motion.div>
          )}

          {/* Кнопка для покупки/продления */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => router.push('/subscribe')}
              className="w-full px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-all"
            >
              {hasSubscription
                ? (language === 'en' ? 'Renew or Change Plan' : 'Продлить или изменить план')
                : (language === 'en' ? 'Subscribe Now' : 'Оформить подписку')
              }
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}

