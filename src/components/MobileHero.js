"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

/**
 * Упрощенная версия Hero для мобильных устройств
 * - Минимум анимаций
 * - Быстрая загрузка
 * - Fallback для медленных соединений
 */
export default function MobileHero() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Fallback таймер для медленных соединений
    const fallbackTimer = setTimeout(() => {
      if (!videoLoaded) {
        setShowFallback(true);
      }
    }, 3000); // 3 секунды на загрузку видео

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, [videoLoaded]);

  // Выбираем видео в зависимости от авторизации
  const videoSrc = user 
    ? "https://pub-24028780ba564e299106a5335d66f54c.r2.dev/videos/webHeroAuth.mp4"
    : "https://pub-24028780ba564e299106a5335d66f54c.r2.dev/videos/webHero.mp4";

  const posterSrc = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev/posters/webHero.jpg";

  // Показываем загрузку до монтирования
  if (!mounted) {
    return (
      <main className="relative h-screen w-full bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-full bg-black">
      {/* Fallback изображение для медленных соединений */}
      {showFallback && !videoLoaded && (
        <img
          src={posterSrc}
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
          onLoad={() => console.log('Fallback image loaded')}
        />
      )}
      
      {/* Видео */}
      <video 
        key={user ? 'auth' : 'guest'}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload="metadata"
        poster={posterSrc}
        onLoadedData={() => {
          setVideoLoaded(true);
          setShowFallback(false);
        }}
        onError={(e) => {
          console.error('Video error:', e);
          setShowFallback(true);
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Простой градиент без анимаций */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-b from-transparent to-black/80 pointer-events-none" />
    </main>
  );
}
