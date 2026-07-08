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
    name: "Месячная подписка",
    nameEn: "Monthly Subscription",
  },
  "3months": {
    name: "Подписка на 3 месяца",
    nameEn: "3 Months Subscription",
  },
  "6months": {
    name: "Подписка на 6 месяцев",
    nameEn: "6 Months Subscription",
  },
  "12months": {
    name: "Подписка на 12 месяцев",
    nameEn: "12 Months Subscription",
  },
  yearly: {
    name: "Подписка на 12 месяцев",
    nameEn: "12 Months Subscription",
  },
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
      router.push("/auth?redirect=/subscription");
    }
  }, [user, isLoading, router]);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-white">{TEXTS[language].common.loading}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return "-";
    let dateObj;
    if (date.toDate) dateObj = date.toDate();
    else if (date.seconds) dateObj = new Date(date.seconds * 1000);
    else if (typeof date === "string") dateObj = new Date(date);
    else dateObj = date;
    return dateObj.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const subscriptionType = subscription?.type || "monthly";
  const subscriptionInfo =
    SUBSCRIPTION_TYPES[subscriptionType] || SUBSCRIPTION_TYPES.monthly;

  return (
    <>
      <Navigation currentPage="subscription" user={user} />
      <div className="min-h-screen bg-app pt-20 pb-20">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold text-white mb-4">
              {language === "en" ? "Subscription" : "Подписка"}
            </h1>
          </motion.div>

          {hasSubscription && subscription ? (
            <motion.div
              className="bg-white/5 border border-brand-500/50 rounded-xl p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-brand-500" />
                <h2 className="text-xl font-bold text-white">
                  {language === "en" ? "Active Subscription" : "Активная подписка"}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">
                    {language === "en" ? "Plan" : "Тип подписки"}
                  </p>
                  <p className="text-white font-semibold">
                    {language === "en" ? subscriptionInfo.nameEn : subscriptionInfo.name}
                  </p>
                </div>

                {subscription.expiresAt && (
                  <div>
                    <p className="text-white/60 text-sm mb-1">
                      {language === "en" ? "Valid until" : "Действует до"}
                    </p>
                    <p className="text-white font-semibold">
                      {formatDate(subscription.expiresAt)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center mb-6">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                  <span className="text-white/60 text-xl">○</span>
                </div>
                <h2 className="text-white font-semibold text-lg mb-1">
                  {TEXTS[language].subscription.noSubscriptionTitle}
                </h2>
                <p className="text-white/50 text-sm">
                  {TEXTS[language].subscription.noSubscriptionSubtitle}
                </p>
              </div>

              <ul className="space-y-2 mb-6 text-left">
                {[
                  TEXTS[language].subscription.features.createWorkouts.title,
                  TEXTS[language].subscription.features.unlimitedAccess.title,
                  TEXTS[language].subscription.features.videoGuides.title,
                ].map((label) => (
                  <li key={label} className="flex items-center gap-2 text-white/70 text-sm">
                    <span className="text-brand-400">✓</span>
                    {label}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={() => router.push("/subscribe")}
              className="w-full px-6 py-4 bg-brand-500 text-black rounded-2xl font-bold hover:bg-brand-400 transition-all shadow-[0_8px_24px_rgba(56,189,248,0.3)]"
            >
              {hasSubscription
                ? language === "en"
                  ? "Renew or Change Plan"
                  : "Продлить или изменить план"
                : language === "en"
                  ? "Subscribe Now"
                  : "Оформить подписку"}
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
