"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import ExercisesSlider from "@/components/ExercisesSlider";
import ViewToggle from "@/components/ViewToggle";
import PremiumModal from "@/components/PremiumModal";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

// Определяем мобильное устройство
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || window.innerWidth < 768;
};

// Определяем скорость соединения
const getConnectionSpeed = () => {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = navigator.connection;
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') return 'slow';
    if (connection.effectiveType === '3g') return 'medium';
  }
  return 'fast';
};

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();

  // Определяем URL видео
  const getVideoSrc = () => {
    if (!mounted) return '/videos/FavVid.mp4'; // Fallback для SSR
    
    const isMobile = isMobileDevice();
    const connectionSpeed = getConnectionSpeed();
    
    // CDN URL
    const baseUrl = 'https://cdn.pure-progression.com';
    
    if (isMobile || connectionSpeed === 'slow') {
      return `${baseUrl}/videos/FavVid_mobile.mp4`;
    }
    
    return `${baseUrl}/videos/FavVid.mp4`;
  };

  const videoSrc = getVideoSrc();

  useEffect(() => {
    setMounted(true);
    
    // Автоматический скролл к началу контента (середина экрана)
    const scrollToContent = () => {
      const scrollPosition = window.innerHeight * 0.5; // 50% от высоты экрана
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    };

    // Небольшая задержка для корректного скролла
    setTimeout(scrollToContent, 100);
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        
        // Загружаем избранные упражнения
        const favoritesQuery = query(
          collection(db, "favorites"),
          where("userId", "==", u.uid)
        );
        unsubscribe = onSnapshot(favoritesQuery, (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            exerciseId: d.data().exerciseId,
            title: d.data().title,
            video: d.data().video,
          }));
          setFavorites(items);
        });
      } else {
        setUser(null);
        setFavorites(null);
        if (unsubscribe) unsubscribe();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  if (!user) {
    return (
      <>
        {/* Видео фон для неавторизованных */}
        <div className="fixed inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            key={videoSrc}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          
          {/* Градиентный блюр - более мягкий */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        {/* Контент поверх видео - начинается с середины экрана */}
        <div className="relative z-10 min-h-screen" style={{ paddingTop: '50vh' }}>
          <div className="max-w-[1200px] mx-auto p-4">
            <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-lg">{TEXTS[language].favorites.title}</h2>
            
            {/* Сообщение для неавторизованных пользователей */}
            <div className="text-center py-20">
              <div className="text-white text-xl font-light mb-6 tracking-wide drop-shadow-lg">
                {TEXTS[language].favorites.loginRequired || "Sign in to save favorites"}
              </div>
              <button 
                onClick={() => window.location.href = '/auth'}
                className="text-white/60 hover:text-white text-sm font-light border border-white/20 hover:border-white/40 py-3 px-8 rounded-lg transition-all duration-300 backdrop-blur-sm bg-black/20"
              >
                {TEXTS[language].auth.signIn || "Sign In"}
              </button>
            </div>
          </div>
        </div>
        <Navigation currentPage="favorites" user={null} />
      </>
    );
  }
  if (favorites === null)
    return <p className="text-center mt-10">{TEXTS[language].common.loading}</p>;

  return (
    <>
      {/* Видео фон */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          key={videoSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        
        {/* Градиентный блюр сверху - более мягкий */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        
        {/* Дополнительный блюр снизу для контента - усиленный */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      {/* Контент поверх видео - начинается с середины экрана */}
      <div className="relative z-10" style={{ paddingTop: '50vh' }}>
        {/* Заголовок и переключатель в ограниченном контейнере */}
        <div className="max-w-[1200px] mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{TEXTS[language].favorites.title}</h2>
            <ViewToggle
              viewMode={viewMode}
              onToggle={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
            />
          </div>
        </div>

        {/* Слайдер упражнений на полную ширину как на главной странице */}
        {favorites.length === 0 ? (
          <div className="max-w-[1200px] mx-auto p-4">
            <p className="text-center mt-10 text-white drop-shadow-lg">{TEXTS[language].favorites.noFavorites}</p>
          </div>
        ) : (
          <ExercisesSlider
            videos={favorites}
            favorites={favorites}
            readOnly={false}
            mode="favorites-page"
            controlledViewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
            showToggle={false}
          />
        )}
      </div>
      <Navigation currentPage="favorites" user={user} />
    </>
  );
}
