"use client";

import { motion } from "framer-motion"
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import MobileHero from "./MobileHero";

export default function Hero() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState('fast');

  useEffect(() => {
    // Определяем мобильное устройство СРАЗУ при инициализации
    const isMobileDevice = typeof window !== 'undefined' && (
      window.innerWidth < 768 || 
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
    
    // Определяем скорость соединения СРАЗУ
    let connectionSpeed = 'fast';
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        connectionSpeed = 'slow';
      } else if (effectiveType === '3g') {
        connectionSpeed = 'medium';
      }
    }
    
    // Устанавливаем все значения СРАЗУ без асинхронности
    setIsMobile(isMobileDevice);
    setConnectionSpeed(connectionSpeed);
    setMounted(true);
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Адаптивный выбор видео в зависимости от устройства и соединения
  const getVideoSrc = () => {
    const baseUrl = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev/videos/";
    
    if (user) {
      // Для авторизованных пользователей
      if (isMobile && connectionSpeed === 'slow') {
        // Мобильная медленная сеть - используем обычное видео (меньше размер)
        return `${baseUrl}webHero.mp4`;
      } else if (isMobile) {
        // Мобильная быстрая сеть - используем авторизованное видео
        return `${baseUrl}webHeroAuth.mp4`;
      } else {
        // Десктоп - всегда авторизованное видео
        return `${baseUrl}webHeroAuth.mp4`;
      }
    } else {
      // Для неавторизованных пользователей
      return `${baseUrl}webHero.mp4`;
    }
  };

  const videoSrc = getVideoSrc();

  // Отладочная информация
  console.log('Hero Debug:', { 
    user: !!user, 
    videoSrc, 
    mounted, 
    isMobile, 
    connectionSpeed 
  });

  // Показываем загрузку только если еще не определили тип устройства
  if (!mounted || (typeof window !== 'undefined' && window.innerWidth < 768 && !isMobile)) {
    return (
      <main className="relative h-screen w-screen bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }

  // Используем мобильную версию для мобильных устройств
  if (isMobile) {
    return <MobileHero />;
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      
      <video 
        key={`${user ? 'auth' : 'guest'}-${isMobile ? 'mobile' : 'desktop'}-${connectionSpeed}`} // Принудительное обновление при смене параметров
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload={isMobile && connectionSpeed === 'slow' ? 'none' : 'metadata'}
        style={{
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>


         {/* Чистый градиент без текста и motion */}
      <div className="absolute bottom-0 w-full h-52 bg-gradient-to-b from-transparent to-black/90 z-20 pointer-events-none" />
{/* Текст поверх видео */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4"
      >
      
      </motion.div>

      <div className="relative z-10 flex flex-col h-full text-white p-6">
        {/* Контент Hero */}
      </div>
    </main>
  );
}

