"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db, isAdmin } from "@/lib/firebase";
import { createSubscription } from "@/lib/payments";
import { getBuyerEmail } from "@/lib/buyerEmail";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { trackWorkoutCreated } from "@/lib/analytics";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { TEXTS } from "@/constants/texts";
import {
  formatPlanPrice,
  formatPlanMonthlyEquivalent,
  getPlanPeriodLabel,
  getPlanSavingsPercent,
  getDefaultPlanId,
  sortPlansForDisplay,
  PLAN_BADGES,
  DEFAULT_PLAN_ID,
  SUPPORTED_CURRENCIES,
} from "@/constants/lavaSubscription";

const FEATURE_ICONS = ["✦", "▶", "◎", "∞"];

function PlanCard({
  plan,
  index,
  language,
  texts,
  selectedCurrency,
  monthlyPlan,
  isSelected,
  onSelect,
}) {
  const badgeKey = PLAN_BADGES[plan.id];
  const badgeLabel = badgeKey ? texts[badgeKey] : null;
  const savings = getPlanSavingsPercent(plan, monthlyPlan, selectedCurrency);
  const monthlyEq = formatPlanMonthlyEquivalent(plan, selectedCurrency);
  const isFeatured = plan.id === DEFAULT_PLAN_ID;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative w-full text-left transition-all duration-200 ${
        isSelected ? "scale-[1.02]" : "hover:scale-[1.01]"
      }`}
    >
      {badgeLabel && (
        <div className="absolute -top-2.5 left-1/2 z-10 -translate-x-1/2">
          <span className="whitespace-nowrap rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
            {badgeLabel}
          </span>
        </div>
      )}

      <div
        className={`relative h-full rounded-2xl border p-5 transition-all ${
          isSelected
            ? "border-brand-500 bg-brand-500/10 shadow-[0_0_40px_rgba(56,189,248,0.12)]"
            : isFeatured
              ? "border-brand-500/30 bg-white/[0.05] shadow-[0_0_24px_rgba(56,189,248,0.05)]"
              : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <div
          className={`absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
            isSelected ? "border-brand-500 bg-brand-500" : "border-white/25 bg-transparent"
          }`}
        >
          {isSelected && (
            <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        <p className="text-white/60 text-xs font-medium uppercase tracking-wider">
          {language === "en"
            ? plan.titleEn || getPlanPeriodLabel(plan.id, language)
            : plan.title || getPlanPeriodLabel(plan.id, language)}
        </p>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">
            {formatPlanPrice(plan.prices?.[selectedCurrency], selectedCurrency)}
          </span>
        </div>

        <p className="text-white/45 text-xs mt-1">
          / {getPlanPeriodLabel(plan.id, language)}
        </p>

        {monthlyEq && (
          <p className="text-brand-400/90 text-sm font-medium mt-2">
            {texts.perMonth.replace("{price}", monthlyEq)}
          </p>
        )}

        {savings != null && (
          <p className="inline-block mt-2 rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-semibold text-brand-400">
            {texts.savePercent.replace("{percent}", String(savings))}
          </p>
        )}
      </div>
    </motion.button>
  );
}

export default function SubscribePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, hasSubscription, isLoading: subscriptionLoading, isAuthReady } = useSubscription();
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [hasPendingWorkout, setHasPendingWorkout] = useState(false);

  useEffect(() => {
    setHasPendingWorkout(!!localStorage.getItem("pending_workout"));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setPlansLoading(true);
      setPlansError(null);
      try {
        const res = await fetch("/api/payments/lava/plans");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || data.details || "Failed to load plans");
        }
        if (!cancelled) {
          const loadedPlans = data.plans || [];
          setPlans(loadedPlans);
          setSelectedPlanId(getDefaultPlanId(loadedPlans));
        }
      } catch (err) {
        if (!cancelled) setPlansError(err.message);
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    }

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null;
  const monthlyPlan = plans.find((p) => p.id === "monthly") || null;
  const displayPlans = sortPlansForDisplay(plans);

  const savePendingWorkout = useCallback(async () => {
    try {
      const pendingWorkoutStr = localStorage.getItem("pending_workout");
      if (!pendingWorkoutStr || !user) return;

      const pendingWorkout = JSON.parse(pendingWorkoutStr);
      await addDoc(collection(db, "workouts"), {
        name: pendingWorkout.name,
        description: pendingWorkout.description || "",
        exercises: pendingWorkout.exercises,
        userId: user.uid,
        createdAt: serverTimestamp(),
        estimatedDuration: pendingWorkout.estimatedDuration,
      });
      trackWorkoutCreated(pendingWorkout.exercises.length);
      localStorage.removeItem("pending_workout");
      router.replace("/my-workouts");
    } catch (err) {
      console.error("[Subscribe] Error saving pending workout:", err);
    }
  }, [user, router]);

  const redirectToWorkout = useCallback(() => {
    const pendingWorkoutId = localStorage.getItem("pending_workout_id");
    if (pendingWorkoutId) {
      localStorage.removeItem("pending_workout_id");
      router.replace(`/workout/${pendingWorkoutId}`);
      return true;
    }
    return false;
  }, [router]);

  useEffect(() => {
    if (!isAuthReady || subscriptionLoading) return;

    if (!user) {
      router.replace(
        hasPendingWorkout
          ? "/auth?redirect=/subscribe&hasWorkout=true"
          : "/auth?redirect=/subscribe"
      );
      return;
    }

    if (hasPendingWorkout && (hasSubscription || isAdmin(user))) {
      savePendingWorkout();
      return;
    }
    if ((hasSubscription || isAdmin(user)) && redirectToWorkout()) {
      return;
    }
  }, [
    user,
    hasSubscription,
    isAuthReady,
    subscriptionLoading,
    router,
    savePendingWorkout,
    redirectToWorkout,
    hasPendingWorkout,
  ]);

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/auth?redirect=/subscribe");
      return;
    }
    if (!selectedPlan) {
      setError(language === "en" ? "Select a plan" : "Выберите план");
      return;
    }

    const buyerEmail = getBuyerEmail(user);
    if (!buyerEmail) {
      setError(
        language === "en"
          ? "Your account must have an email to subscribe"
          : "Для подписки нужен email в аккаунте"
      );
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const paymentData = await createSubscription(
        user.uid,
        selectedPlan.id,
        buyerEmail,
        selectedCurrency,
        language === "ru" ? "RU" : "EN",
        {
          offerId: selectedPlan.offerId,
          periodicity: selectedPlan.periodicity,
        }
      );

      if (paymentData.paymentId) {
        localStorage.setItem("last_subscription_payment_id", paymentData.paymentId);
        localStorage.setItem("last_subscription_type", selectedPlan.id);
        localStorage.setItem("last_subscription_user_id", user.uid);
      }

      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (err) {
      setError(
        err.message ||
          (language === "en" ? "Subscription error" : "Ошибка при создании подписки")
      );
      setIsProcessing(false);
    }
  };

  if (!isAuthReady || subscriptionLoading || plansLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-white">{TEXTS[language].common.loading}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-white">
          {language === "en" ? "Redirecting..." : "Перенаправление..."}
        </div>
      </div>
    );
  }

  const texts = TEXTS[language].subscription;
  const featureItems = [
    texts.features.createWorkouts,
    texts.features.videoGuides,
    texts.features.trackProgress,
    texts.features.unlimitedAccess,
  ];

  const ctaLabel = isProcessing
    ? texts.processing
    : selectedPlan
      ? `${texts.subscribeNow} — ${formatPlanPrice(selectedPlan.prices?.[selectedCurrency], selectedCurrency)}`
      : texts.subscribeNow;

  return (
    <>
      <Navigation currentPage="subscribe" user={user} />
      <div className="relative min-h-screen pt-20 pb-28 sm:pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">
              {texts.title}
            </h1>
            <p className="text-white/55 text-base max-w-md mx-auto leading-relaxed">
              {texts.subtitle}
            </p>
          </motion.div>

          {hasPendingWorkout && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 flex items-start gap-3 rounded-2xl border border-brand-500/40 bg-brand-500/10 px-4 py-3.5"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500 text-black text-sm font-bold">
                ✓
              </span>
              <p className="text-brand-100 text-sm leading-relaxed">{texts.workoutWillBeSaved}</p>
            </motion.div>
          )}

          <motion.div
            className="mb-10 grid grid-cols-2 gap-2 sm:gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            {featureItems.map((item, i) => (
              <div
                key={item.title}
                className="flex gap-2.5 rounded-xl border border-white/8 bg-white/[0.04] p-3 sm:p-3.5"
              >
                <span className="text-brand-400/80 text-sm shrink-0 w-4 text-center">{FEATURE_ICONS[i]}</span>
                <div className="min-w-0">
                  <p className="text-white text-xs sm:text-sm font-medium leading-tight">{item.title}</p>
                  <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 leading-snug hidden sm:block">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
              {texts.choosePlan}
            </h2>
            <div className="flex gap-1 rounded-lg bg-white/5 p-1">
              {SUPPORTED_CURRENCIES.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => setSelectedCurrency(currency)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedCurrency === currency
                      ? "bg-white text-black"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>

          {plansError && (
            <div className="mb-6 text-center text-red-400 text-sm rounded-xl border border-red-500/30 bg-red-500/10 py-3 px-4">
              {plansError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
            {displayPlans.map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={index}
                language={language}
                texts={texts}
                selectedCurrency={selectedCurrency}
                monthlyPlan={monthlyPlan}
                isSelected={selectedPlanId === plan.id}
                onSelect={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 text-center text-red-400 text-sm">{error}</div>
          )}

          <div className="hidden sm:block max-w-md mx-auto">
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={isProcessing || !selectedPlan || plans.length === 0}
              className="w-full py-4 rounded-2xl bg-brand-500 text-black font-bold text-base disabled:opacity-50 hover:bg-brand-400 transition-all shadow-[0_8px_32px_rgba(56,189,248,0.2)] active:scale-[0.99]"
            >
              {ctaLabel}
            </button>
            <p className="text-center text-white/35 text-xs mt-3">{texts.paymentInfo}</p>
            <button
              type="button"
              onClick={() => router.push("/payment/success?type=subscription")}
              className="mt-2 w-full text-center text-brand-400/90 text-xs hover:text-brand-300 transition-colors"
            >
              {texts.alreadyPaid}
            </button>
            {isAdmin(user) && (
              <p className="text-center text-amber-400/70 text-[11px] mt-3 px-2 leading-relaxed">
                {language === "en"
                  ? "Test payment in incognito or logged out of lava.top"
                  : "Тест оплаты: инкогнито или выйти из lava.top"}
              </p>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 sm:hidden z-50 border-t border-white/10 bg-app/95 backdrop-blur-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {selectedPlan && (
            <p className="text-center text-white/40 text-xs mb-2">
              {texts.selectedPlan}:{" "}
              {language === "en"
                ? selectedPlan.titleEn || getPlanPeriodLabel(selectedPlan.id, language)
                : selectedPlan.title || getPlanPeriodLabel(selectedPlan.id, language)}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isProcessing || !selectedPlan || plans.length === 0}
            className="w-full py-3.5 rounded-2xl bg-brand-500 text-black font-bold disabled:opacity-50 active:scale-[0.99]"
          >
            {ctaLabel}
          </button>
          <p className="text-center text-white/30 text-[10px] mt-2">{texts.paymentInfo}</p>
          <button
            type="button"
            onClick={() => router.push("/payment/success?type=subscription")}
            className="mt-1.5 w-full text-center text-brand-400/90 text-[10px]"
          >
            {texts.alreadyPaid}
          </button>
        </div>
      </div>
    </>
  );
}
