"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import AuthForm from "@/components/AuthForm";
import { auth, isAdmin } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useSubscription } from "@/hooks/useSubscription";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { hasSubscription, isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Обрабатываем редирект после загрузки подписки
  useEffect(() => {
    if (!user || subscriptionLoading) return;

    // Проверяем параметр redirect из URL
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    // Если есть сохраненная тренировка
    const hasPendingWorkout = typeof window !== 'undefined' && localStorage.getItem('pending_workout');
    
    if (hasPendingWorkout) {
      // Если подписка активна - сразу идем на my-workouts (тренировка сохранится там)
      if (hasSubscription || isAdmin(user)) {
        router.replace('/my-workouts');
      } else {
        // Если подписки нет - идем на subscribe
        router.replace('/subscribe');
      }
    } else if (redirect) {
      // Если есть параметр redirect, используем его
      if (redirect === '/subscribe' && (hasSubscription || isAdmin(user))) {
        // Если редирект на subscribe, но подписка уже есть - идем на главную
        router.replace('/');
      } else {
        router.replace(redirect);
      }
    } else {
      // Если нет pending_workout и нет redirect - всегда на главную
      router.replace("/");
    }
  }, [user, hasSubscription, subscriptionLoading, router]);

  const baseUrl = `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL || 'https://pub-24028780ba564e299106a5335d66f54c.r2.dev'}/videos/`;
  const videoSrc = `${baseUrl}webHero.mp4`;
  const posterSrc = `${baseUrl.replace('/videos/', '/posters/')}webHero.jpg`;

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Фоновое видео */}
      <video
        className="fixed inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={posterSrc}
        style={{ zIndex: 0 }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      
      {/* Затемнение для читаемости формы */}
      <div className="fixed inset-0 bg-black/40" style={{ zIndex: 1 }} />

      {/* Контент поверх видео */}
      <div className="relative" style={{ zIndex: 10 }}>
        <Navigation currentPage="auth" user={user} />
        <AuthForm />
      </div>
    </div>
  );
}
