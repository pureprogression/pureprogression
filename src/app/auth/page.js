"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import AuthForm from "@/components/AuthForm";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useSubscription } from "@/hooks/useSubscription";

export default function AuthPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { isLoading: subscriptionLoading } = useSubscription();

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Плавное появление видео после монтирования
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setVideoLoaded(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  useEffect(() => {
    if (!user || subscriptionLoading) return;

    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");
    const hasPendingWorkout =
      typeof window !== "undefined" && localStorage.getItem("pending_workout");

    if (hasPendingWorkout) {
      router.replace("/my-workouts");
      return;
    }
    if (redirect) {
      const payPaths = ["/subscribe", "/subscription", "/renew-subscription", "/payment"];
      if (payPaths.some((p) => redirect === p || redirect.startsWith(p + "/"))) {
        router.replace("/");
        return;
      }
      router.replace(redirect);
      return;
    }
    router.replace("/");
  }, [user, subscriptionLoading, router]);

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
      
      {/* Затемнение для читаемости формы - сделано менее темным */}
      <div className="fixed inset-0 bg-black/5" style={{ zIndex: 1 }} />

      {/* Контент поверх видео */}
      <div className="relative" style={{ zIndex: 10 }}>
        <Navigation currentPage="auth" user={user} />
        <AuthForm />
      </div>
    </div>
  );
}
