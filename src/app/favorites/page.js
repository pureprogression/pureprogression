"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [filterTransitioning, setFilterTransitioning] = useState(false);
  const { language } = useLanguage();
  const router = useRouter();

  // Определяем URL видео - используем видео для неавторизованных пользователей
  const getVideoSrc = () => {
    const baseUrl = "https://pub-24028780ba564e299106a5335d66f54c.r2.dev/videos/";
    
    if (!mounted) return `${baseUrl}webHero.mp4`; // Fallback для SSR
    
    const isMobile = isMobileDevice();
    const connectionSpeed = getConnectionSpeed();
    
    // Для всех пользователей на странице favorites используем видео для неавторизованных
    if (isMobile && connectionSpeed === 'slow') {
      // Мобильная медленная сеть - используем обычное видео (меньше размер)
      return `${baseUrl}webHero.mp4`;
    } else if (isMobile) {
      // Мобильная быстрая сеть - используем видео для неавторизованных
      return `${baseUrl}webHero.mp4`;
    } else {
      // Десктоп - используем видео для неавторизованных
      return `${baseUrl}webHero.mp4`;
    }
  };

  const videoSrc = getVideoSrc();

  useEffect(() => {
    setMounted(true);
    
    // Добавляем data-атрибут к body для CSS
    document.body.setAttribute('data-page', 'favorites');
    
    // Устанавливаем начальную позицию скролла
    const setInitialScroll = () => {
      const scrollPosition = window.innerHeight * 0.66; // 66% как на главной
      window.scrollTo(0, scrollPosition);
    };

    // Агрессивные попытки установить скролл
    setInitialScroll();
    
    // Множественные попытки с разными задержками
    const timers = [];
    for (let i = 0; i <= 20; i++) {
      timers.push(setTimeout(setInitialScroll, i * 10)); // 0ms, 10ms, 20ms, ..., 200ms
    }
    
    // Дополнительные попытки после загрузки
    const loadTimer = setTimeout(setInitialScroll, 500);
    const finalTimer = setTimeout(setInitialScroll, 1000);
    
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(loadTimer);
      clearTimeout(finalTimer);
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
        // Для неавторизованных: перенаправляем на страницу авторизации
        router.push('/auth');
        if (unsubscribeFavorites) unsubscribeFavorites();
      }
    });

    return () => {
      if (unsubscribeFavorites) unsubscribeFavorites();
      unsubscribeAuth();
    };
  }, []);

  // Анимация при изменении фильтра
  useEffect(() => {
    setFilterTransitioning(true);
    const timer = setTimeout(() => {
      setFilterTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedGroup]);

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

  // Страница избранного доступна всем: неавторизованные видят локальные избранные, авторизованные — из Firebase

  return (
    <>
      {/* Контент - как на главной странице */}
      <div className="relative">
        <Navigation currentPage="favorites" user={user} disableSwipe={viewMode === "slider"} />
        
        {/* Hero секция с видео - показываем всегда */}
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
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* Фильтры показываем только если есть избранные */}
        {favorites.length > 0 && (
          <div className="relative">
            <div className="flex items-center">
              <ExercisesFilter
                exercises={exercises}
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
              />
            </div>
          </div>
        )}

        {/* Слайдер упражнений */}
        {favorites.length === 0 ? (
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-center text-white/80 text-sm">{TEXTS[language].favorites.noFavorites}</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="max-w-[1200px] mx-auto p-4">
            <p className="text-center mt-10 text-white drop-shadow-lg">
              {TEXTS[language].favorites.noExercisesInGroup || "No exercises found for this muscle group"}
            </p>
          </div>
        ) : (
          <ExercisesSlider
            videos={filteredExercises}
            favorites={favorites}
            readOnly={false}
            mode="favorites-page"
            controlledViewMode={viewMode}
            onToggleViewMode={handleReturnToGrid}
            onSlideChange={handleSlideChange}
            onToggleFavorite={undefined}
            onExerciseClick={handleExerciseClick}
            initialSlideIndex={initialSlide}
            showToggle={false}
            filterTransitioning={filterTransitioning}
          />
        )}
      </div>
    </>
  );
}
