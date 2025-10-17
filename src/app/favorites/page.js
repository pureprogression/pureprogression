"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import ExercisesSlider from "@/components/ExercisesSlider";
import ExercisesFilter from "@/components/ExercisesFilter";
import { exercises } from "@/data/exercises";
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
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [initialSlide, setInitialSlide] = useState(0);
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
    
    // Добавляем data-атрибут к body для CSS
    document.body.setAttribute('data-page', 'favorites');
    
    // Устанавливаем начальную позицию скролла сразу
    const setInitialScroll = () => {
      const scrollPosition = window.innerHeight * 0.66; // 66% как на главной
      window.scrollTo(0, scrollPosition);
    };

    // Устанавливаем позицию сразу без задержки
    setInitialScroll();
    
    // Дополнительные попытки для надежности
    const timer1 = setTimeout(setInitialScroll, 50);
    const timer2 = setTimeout(setInitialScroll, 100);
    const timer3 = setTimeout(setInitialScroll, 200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      // Убираем data-атрибут при размонтировании
      document.body.removeAttribute('data-page');
    };
  }, []);

  useEffect(() => {
    let unsubscribeFavorites = null;
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u || null);
      if (u) {
        const qRef = query(
          collection(db, "favorites"),
          where("userId", "==", u.uid)
        );
        unsubscribeFavorites = onSnapshot(qRef, (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            exerciseId: d.data().exerciseId,
            title: d.data().title,
            video: d.data().video,
          }));
          setFavorites(items);
        });
      } else {
        setFavorites([]);
        if (unsubscribeFavorites) unsubscribeFavorites();
      }
    });

    return () => {
      if (unsubscribeFavorites) unsubscribeFavorites();
      unsubscribeAuth();
    };
  }, []);

  // Фильтруем упражнения по выбранной группе (только избранные)
  const filteredExercises = favorites.filter((fav) => {
    if (selectedGroup === "All") return true;
    // Находим оригинальное упражнение по exerciseId
    const originalExercise = exercises.find(ex => ex.id === fav.exerciseId);
    return originalExercise && originalExercise.muscleGroups.includes(selectedGroup);
  });

  const handleExerciseClick = (exerciseIndex) => {
    console.log('[Favorites] Exercise clicked:', exerciseIndex);
    setInitialSlide(exerciseIndex);
    setViewMode("slider");
  };

  const handleReturnToGrid = (currentSlideIndex) => {
    setInitialSlide(currentSlideIndex);
    setViewMode("grid");
  };

  const handleSlideChange = (slideIndex) => {
    setInitialSlide(slideIndex);
  };

  // Сбрасываем initialSlide когда возвращаемся в Grid
  useEffect(() => {
    if (viewMode === "grid") {
      const timer = setTimeout(() => {
        setInitialSlide(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

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
          
          {/* Градиентный блюр */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        {/* Контент поверх видео */}
        <div className="relative z-10 min-h-screen" style={{ paddingTop: '50vh' }}>
          <div className="max-w-[1200px] mx-auto p-4">
            <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-lg">{TEXTS[language].favorites.title}</h2>
            
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

  return (
    <>
      {/* Контент - как на главной странице */}
      <div className="relative">
        <Navigation currentPage="favorites" user={user} disableSwipe={viewMode === "slider"} />
        
        {/* Hero секция с видео */}
        <div className="relative h-screen">
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
        </div>

        {/* Фильтры */}
        <div className="relative">
          <div className="flex items-center">
            <ExercisesFilter
              exercises={exercises}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
            />
          </div>
        </div>

        {/* Слайдер упражнений */}
        {favorites.length === 0 ? (
          <div className="max-w-[1200px] mx-auto p-4">
            <p className="text-center mt-10 text-white drop-shadow-lg">{TEXTS[language].favorites.noFavorites}</p>
          </div>
        ) : (
          <ExercisesSlider
            videos={filteredExercises}
            favorites={favorites}
            readOnly={false}
            mode="default"
            controlledViewMode={viewMode}
            onToggleViewMode={handleReturnToGrid}
            onSlideChange={handleSlideChange}
            onToggleFavorite={undefined}
            onExerciseClick={handleExerciseClick}
            initialSlideIndex={initialSlide}
            showToggle={false}
          />
        )}
      </div>
    </>
  );
}
