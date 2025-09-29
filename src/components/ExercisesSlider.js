"use client";

import { useRef, useState, useEffect, memo, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Custom styles for white navigation and pagination
const swiperStyles = `
  .swiper-button-next,
  .swiper-button-prev {
    color: white !important;
    background: rgba(0, 0, 0, 0.3) !important;
    border-radius: 50% !important;
    width: 16px !important;
    height: 16px !important;
    margin-top: -8px !important;
  }
  
  .swiper-button-next:after,
  .swiper-button-prev:after {
    font-size: 6px !important;
  }
  
  .swiper-pagination-bullet {
    background: rgba(255, 255, 255, 0.5) !important;
    opacity: 1 !important;
    width: 6px !important;
    height: 6px !important;
  }
  
  .swiper-pagination-bullet-active {
    background: white !important;
  }
`;

// --- Карточка упражнения ---
const ExerciseCard = memo(({ ex, isFavorite, onToggleFavorite, readOnly, showRemoveButton }) => (
  <div className="relative w-full aspect-[9/16] overflow-hidden rounded-xl shadow-md">
    <video
      src={ex.video}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      webkit-playsinline="true"
      className="absolute inset-0 w-full h-full object-cover"
    />
    
    {/* Кнопка для слайдера - минималистичный индикатор (круг) */}
    {!readOnly && !showRemoveButton && onToggleFavorite && (
      <div className="absolute top-2 right-2 z-30">
        <button
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          className={`group relative p-2 rounded-full bg-black/35 hover:bg-black/55 shadow-md transition-all duration-300 ease-out`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(ex);
          }}
        >
          {/* ripple */}
          <span className="pointer-events-none absolute inset-0 rounded-full scale-50 opacity-0 group-active:opacity-100 group-active:scale-110 transition-all duration-500 ease-out bg-white/15" />
          {/* indicator */}
          <span
            className={`relative block w-4 h-4 rounded-full border-2 transition-all duration-300 ease-out transform drop-shadow
              ${isFavorite ? "bg-white border-white" : "bg-transparent border-white/80 group-hover:border-white"}
              group-hover:scale-110 group-active:scale-95`}
          />
        </button>
      </div>
    )}
    
    {/* Кнопка для страницы избранного - удаление */}
    {showRemoveButton && (
      <div className="absolute top-2 right-2 z-30">
        <button
          aria-label="Удалить из избранного"
          className="group relative p-2 rounded-full bg-black/35 hover:bg-black/55 shadow-md transition-all duration-300 ease-out"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(ex);
          }}
        >
          {/* ripple */}
          <span className="pointer-events-none absolute inset-0 rounded-full scale-50 opacity-0 group-active:opacity-100 group-active:scale-110 transition-all duration-500 ease-out bg-white/15" />
          {/* indicator */}
          <span className="relative block w-4 h-4 rounded-full border-2 border-white/80 group-hover:border-white group-hover:bg-white transition-all duration-300 ease-out transform group-hover:scale-110 group-active:scale-95 drop-shadow" />
        </button>
      </div>
    )}
    
    {/* <p className="absolute bottom-2 left-2 text-white text-sm font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pr-2">
      {ex.title}
    </p> */}
  </div>
));

export default function ExercisesSlider({
  videos,
  favorites = [],
  readOnly = false,
  onToggleFavorite,
  mode = "default", // "default" | "favorites-page"
  controlledViewMode,
  onToggleViewMode,
  showToggle = true,
}) {
  const swiperRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [viewMode, setViewMode] = useState("slider");
  const effectiveViewMode = controlledViewMode || viewMode;

  // Подпись текущего набора видео (по id) для анимации при смене фильтра
  const videosSignature = useMemo(() => {
    if (!videos) return "";
    try {
      return videos.map((v) => v.id || v.exerciseId || "?").join("|");
    } catch {
      return String(videos?.length || 0);
    }
  }, [videos]);

  // Плавная анимация появления при изменении списка видео или режима просмотра
  const [fadeIn, setFadeIn] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewModeChanged, setViewModeChanged] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle' | 'fadeOut' | 'fadeIn'
  
  useEffect(() => {
    setAnimationPhase('fadeOut');
    setIsTransitioning(true);
    setFadeIn(true);
    
    const timeout1 = setTimeout(() => {
      setAnimationPhase('fadeIn');
      setFadeIn(false);
    }, 150);
    
    const timeout2 = setTimeout(() => {
      setIsTransitioning(false);
      setViewModeChanged(false);
      setAnimationPhase('idle');
    }, 600);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [videosSignature, effectiveViewMode]);

  // Отдельный эффект для переключения режима просмотра
  useEffect(() => {
    setViewModeChanged(true);
  }, [effectiveViewMode]);

  // Определяем экран
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDesktop(window.innerWidth >= 1024);
    }
  }, []);

  if (!videos || videos.length === 0) {
    return mode === "favorites-page" 
      ? <p className="text-center py-8">Нет избранных упражнений</p>
      : null;
  }

  const handleSlideChange = (swiper) => {
    const slides = swiper.slides;
    slides.forEach((slide, idx) => {
      const video = slide.querySelector("video");
      if (!video) return;
      if (isDesktop) {
        video.play().catch(() => {});
      } else {
        if (idx === swiper.activeIndex) video.play().catch(() => {});
        else video.pause();
      }
    });
  };

  // --- Универсальная функция для работы с избранным ---
  const internalToggleFavorite = async (ex) => {
    if (!auth.currentUser) {
      alert("Необходимо войти в аккаунт, чтобы управлять избранным.");
      return;
    }

    const userId = auth.currentUser.uid;
    
    // Для режима страницы избранного используем ID документа из Firebase
    const exerciseId = ex.exerciseId || ex.id;
    const docId = mode === "favorites-page" ? ex.id : `${userId}_${exerciseId}`;
    const docRef = doc(db, "favorites", docId);

    try {
      if (mode === "favorites-page") {
        // На странице избранного всегда удаляем по docId
        await deleteDoc(docRef);
      } else {
        // В слайдере переключаем состояние, проверяя существование документа напрямую
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, {
            userId,
            exerciseId,
            title: ex.title,
            video: ex.video?.startsWith("/") ? ex.video : `/${ex.video}`,
          });
        }
      }
    } catch (err) {
      console.error("Ошибка при обновлении избранного:", err);
      alert("Не удалось обновить избранное. Подробности в консоли.");
    }
  };

  const handleToggleFavorite = onToggleFavorite || internalToggleFavorite;

  // Функция для обновления локального состояния после удаления
  const handleFavoriteClick = async (ex) => {
    await handleToggleFavorite(ex);
    
    // Если это кастомная функция, вызываем её и выходим
    if (onToggleFavorite) return;
    
    // Для внутренней логики обновляем локальное состояние
    if (mode === "favorites-page") {
      // На странице избранного удаляем элемент из списка
      // Это нужно передать через callback наверх или использовать глобальное состояние
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <style dangerouslySetInnerHTML={{ __html: swiperStyles }} />
      {showToggle && (
        <div className="flex justify-end mb-4">
          <button
            className="group p-2 rounded-lg transition-all duration-200 ease-out hover:opacity-80 focus:outline-none"
            onClick={() => {
              if (onToggleViewMode) onToggleViewMode();
              else setViewMode(effectiveViewMode === "slider" ? "grid" : "slider");
            }}
            aria-label={effectiveViewMode === "slider" ? "Показать сеткой" : "Показать слайдером"}
          >
            {effectiveViewMode === "slider" ? (
              <div className="grid grid-cols-2 gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
                <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
                <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
              </div>
            )}
          </button>
        </div>
      )}

      <div className="bg-black p-4 rounded-xl">
        <div 
          className={`transition-all duration-400 ease-out ${
            animationPhase === 'fadeOut' ? 
              (viewModeChanged ? "opacity-0 translate-y-3 scale-95" : "opacity-0 translate-y-2 scale-98") : 
            animationPhase === 'fadeIn' ?
              "opacity-100 translate-y-0 scale-100" :
              "opacity-100 translate-y-0 scale-100"
          } ${isTransitioning ? "pointer-events-none" : ""}`} 
          key={`${videosSignature}-${effectiveViewMode}`}
        >
        {effectiveViewMode === "slider" ? (
          <Swiper
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              handleSlideChange(swiper);
            }}
            onSlideChange={handleSlideChange}
            modules={[Pagination, Navigation]}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            pagination={{ clickable: true }}
            navigation
            grabCursor
            speed={400}
          >
            {videos.map((ex) => (
              <SwiperSlide key={ex.id || ex.exerciseId}>
                <ExerciseCard
                  ex={ex}
                  isFavorite={favorites.some(f => f.id === ex.id || f.exerciseId === ex.id)}
                  onToggleFavorite={handleFavoriteClick}
                  readOnly={readOnly}
                  showRemoveButton={mode === "favorites-page"}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((ex) => (
              <ExerciseCard
                key={ex.id || ex.exerciseId}
                ex={ex}
                isFavorite={favorites.some(f => f.id === ex.id || f.exerciseId === ex.id)}
                onToggleFavorite={handleFavoriteClick}
                readOnly={readOnly}
                showRemoveButton={mode === "favorites-page"}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}