"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import AuthForm from "@/components/AuthForm";
import { useAuthReady } from "@/hooks/useAuthReady";
import { useSubscription } from "@/hooks/useSubscription";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AuthPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user: authUser, isAuthReady, redirectHandled } = useAuthReady();
  const { isLoading: subscriptionLoading } = useSubscription();
  const [mounted, setMounted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [switchAccount, setSwitchAccount] = useState(false);
  const [authContext, setAuthContext] = useState(null); // 'subscribe' | 'workout' | null

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setSwitchAccount(urlParams.get("switch") === "1");
      const redirect = urlParams.get("redirect");
      const hasWorkout = urlParams.get("hasWorkout") === "true";
      if (redirect === "/subscribe" || hasWorkout) {
        setAuthContext(hasWorkout ? "workout" : "subscribe");
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setVideoLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  useEffect(() => {
    if (!isAuthReady || !redirectHandled || !authUser || subscriptionLoading) return;
    if (switchAccount) return;

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");
    const hasPendingWorkout =
      typeof window !== "undefined" && localStorage.getItem("pending_workout");

    if (hasPendingWorkout) {
      router.replace("/my-workouts");
      return;
    }
    if (redirect) {
      router.replace(redirect);
      return;
    }
    router.replace("/");
  }, [
    authUser,
    isAuthReady,
    redirectHandled,
    subscriptionLoading,
    switchAccount,
    router,
  ]);

  const baseUrl = `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL || 'https://pub-24028780ba564e299106a5335d66f54c.r2.dev'}/videos/`;
  const videoSrc = `${baseUrl}webHero.mp4`;
  const posterSrc = `${baseUrl.replace('/videos/', '/posters/')}webHero.jpg`;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <video
        className="fixed inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={posterSrc}
        onCanPlay={() => setVideoLoaded(true)}
        onLoadedData={() => setVideoLoaded(true)}
        style={{ 
          zIndex: 0,
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      
      <div className="fixed inset-0 bg-black/5" style={{ zIndex: 1 }} />

      <div className="relative" style={{ zIndex: 10 }}>
        <Navigation currentPage="auth" user={authUser} />
        {authContext && !switchAccount && (
          <div className="max-w-md mx-auto px-4 mt-4 mb-1">
            <p className="text-center text-sm text-brand-100 leading-relaxed rounded-2xl border border-brand-500/35 bg-brand-500/10 px-4 py-3">
              {authContext === "workout"
                ? TEXTS[language].auth.redirectWorkout
                : TEXTS[language].auth.redirectSubscribe}
            </p>
          </div>
        )}
        {switchAccount && authUser && (
          <div className="max-w-md mx-auto px-4 mt-4 mb-2 text-center">
            <p className="text-amber-300/90 text-sm bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              {language === "en"
                ? `Signed in as ${authUser.email}. Use Google below to pick a different account.`
                : `Вы вошли как ${authUser.email}. Нажмите «Войти через Google» ниже, чтобы выбрать другой аккаунт.`}
            </p>
          </div>
        )}
        <AuthForm />
      </div>
    </div>
  );
}
