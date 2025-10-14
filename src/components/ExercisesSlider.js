"use client";

import { useRef, useState, useEffect, memo, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import LazyVideo from "./LazyVideo";

import "swiper/css";
import "swiper/css/navigation";

// Custom styles for white navigation
const swiperStyles = `
  .swiper-button-next,
  .swiper-button-prev {
    color: rgba(255, 255, 255, 0.6) !important;
    background: rgba(0, 0, 0, 0.2) !important;
    border-radius: 50% !important;
    width: 8px !important;
    height: 8px !important;
    margin-top: -4px !important;
  }
  
  .swiper-button-next:after,
  .swiper-button-prev:after {
    font-size: 3px !important;
    font-weight: 100 !important;
  }
`;

// --- Карточка упражнения ---
const ExerciseCard = memo(function ExerciseCard({ ex, isFavorite, onToggleFavorite, readOnly, showRemoveButton, eager = false, preloadLevel = "none", isActive = true }) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  
  // Сбрасываем и запускаем анимацию при смене активного слайда
  useEffect(() => {
    if (isActive && isVideoReady) {
      setShowIndicator(false);
      const timer = setTimeout(() => setShowIndicator(true), 100);
      return () => clearTimeout(timer);
    } else if (!isActive) {
      setShowIndicator(false);
    }
  }, [isActive, isVideoReady]);
  
  return (
    <div className="relative w-full aspect-[9/16] overflow-hidden rounded-xl shadow-md">
    <LazyVideo
      src={ex.video}
      poster={ex.poster}
      muted
      loop
      playsInline
      autoPlay
      preload={preloadLevel}
      eager={eager}
      onVideoReady={() => setIsVideoReady(true)}
      className="absolute inset-0 w-full h-full object-cover"
    />
    
    {/* Кнопка для слайдера - минималистичный индикатор (круг) - показываем после загрузки видео */}
    {!readOnly && !showRemoveButton && onToggleFavorite && (
      <div className={`absolute top-2 right-2 z-30 transition-opacity duration-[1200ms] ease-in-out ${
        showIndicator ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          className="group relative p-2 rounded-full bg-black/35 hover:bg-black/55 shadow-md transition-all duration-300 ease-out w-9 h-9 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(ex);
          }}
        >
          {/* ripple */}
          <span className="pointer-events-none absolute inset-0 rounded-full scale-50 opacity-0 group-active:opacity-100 group-active:scale-110 transition-all duration-500 ease-out bg-white/15" />
          {/* indicator - фиксированный размер */}
          <span
            style={{ width: '16px', height: '16px' }}
            className={`relative block rounded-full border-2 transition-all duration-[1200ms] ease-in-out drop-shadow
              ${showIndicator ? 'scale-100' : 'scale-50'}
              ${isFavorite ? "bg-white border-white shadow-lg" : "bg-transparent border-white/80 group-hover:border-white"}`}
          />
        </button>
      </div>
    )}
    
    {/* Кнопка для страницы избранного - удаление - показываем после загрузки видео */}
    {showRemoveButton && (
      <div className={`absolute top-2 right-2 z-30 transition-opacity duration-[1200ms] ease-in-out ${
        showIndicator ? 'opacity-100' : 'opacity-0'
      }`}>
        <button
          aria-label="Удалить из избранного"
          className="group relative p-2 rounded-full bg-black/35 hover:bg-black/55 shadow-md transition-all duration-300 ease-out w-9 h-9 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(ex);
          }}
        >
          {/* ripple */}
          <span className="pointer-events-none absolute inset-0 rounded-full scale-50 opacity-0 group-active:opacity-100 group-active:scale-110 transition-all duration-500 ease-out bg-white/15" />
          {/* indicator - фиксированный размер */}
          <span 
            style={{ width: '16px', height: '16px' }}
            className={`relative block rounded-full border-2 bg-white border-white shadow-lg transition-all duration-[1200ms] ease-in-out drop-shadow
              ${showIndicator ? 'scale-100' : 'scale-50'}`}
          />
        </button>
      </div>
    )}
    
    {/* <p className="absolute bottom-2 left-2 text-white text-sm font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] pr-2">
      {ex.title}
    </p> */}
    </div>
  );
});

export default function ExercisesSlider({
  videos,
  favorites = [],
  readOnly = false,
  onToggleFavorite,
  mode = "default", // "default" | "favorites-page"
  controlledViewMode,
  onToggleViewMode,
  onSlideChange,
  onExerciseClick,
  initialSlideIndex = 0,
  showToggle = true,
}) {
  const swiperRef = useRef(null);
  const gridRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [viewMode, setViewMode] = useState("slider");
  const effectiveViewMode = controlledViewMode || viewMode;
  
  const [hasAnimated, setHasAnimated] = useState(false);
  const [sliderMounted, setSliderMounted] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [scrollToIndex, setScrollToIndex] = useState(null);

  // Монтируем Slider сразу чтобы видео начали грузиться
  useEffect(() => {
    setSliderMounted(true);
  }, []);

  // Предзагружаем первые 5 слайдов для плавного старта
  useEffect(() => {
    if (effectiveViewMode === "slider" && swiperRef.current) {
      const timer = setTimeout(() => {
        const slides = swiperRef.current.slides;
        // Загружаем первые 5 слайдов постепенно
        [0, 1, 2, 3, 4].forEach((i, index) => {
          setTimeout(() => {
            if (i < slides.length) {
              const video = slides[i]?.querySelector('video');
              if (video && video.readyState < 2) {
                video.load();
                // Автоплей только для текущего
                if (i === initialSlideIndex || i === 0) {
                  video.play().catch(() => {});
                }
              }
            }
          }, index * 200); // Загружаем постепенно с задержкой 200мс
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [effectiveViewMode, initialSlideIndex]);

  // Переключаем на нужный слайд когда меняется initialSlideIndex и viewMode становится slider
  useEffect(() => {
    if (swiperRef.current && effectiveViewMode === "slider") {
      console.log('[ExercisesSlider] Setting slide to:', initialSlideIndex);
      swiperRef.current.slideTo(initialSlideIndex, 0);
      
      // Принудительно запускаем загрузку видео в текущем и соседних слайдах
      setTimeout(() => {
        const slides = swiperRef.current.slides;
        [initialSlideIndex - 1, initialSlideIndex, initialSlideIndex + 1].forEach(i => {
          if (i >= 0 && i < slides.length) {
            const video = slides[i]?.querySelector('video');
            if (video && video.readyState < 2) {
              video.load();
            }
          }
        });
      }, 50);
    }
  }, [effectiveViewMode, initialSlideIndex]);

  // Отмечаем что анимация была показана (чтобы не повторять при каждом возврате в Grid)
  useEffect(() => {
    if (effectiveViewMode === "grid" && !hasAnimated) {
      const timer = setTimeout(() => {
        setHasAnimated(true);
      }, videos.length * 150 + 600);
      return () => clearTimeout(timer);
    }
  }, [effectiveViewMode, hasAnimated, videos.length]);

  // Скроллим к нужному элементу при возврате в Grid (до показа)
  useEffect(() => {
    if (effectiveViewMode === "grid" && scrollToIndex !== null && gridRef.current) {
      const gridItems = gridRef.current.querySelectorAll('[data-exercise-index]');
      const targetItem = gridItems[scrollToIndex];
      
      if (targetItem) {
        // Мгновенно скроллим БЕЗ анимации, до того как Grid станет видимым
        requestAnimationFrame(() => {
          targetItem.scrollIntoView({
            behavior: 'auto',
            block: 'center',
            inline: 'nearest'
          });
          setScrollToIndex(null);
        });
      }
    }
  }, [effectiveViewMode, scrollToIndex]);

  // Обработчик двойного тапа для возврата в Grid
  const [lastTap, setLastTap] = useState(0);
  
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300; // 300ms между тапами
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Это двойной тап!
      if (onToggleViewMode && effectiveViewMode === "slider") {
        setScrollToIndex(activeSlideIndex); // Запоминаем индекс для скролла
        onToggleViewMode(activeSlideIndex); // Передаем текущий индекс слайда
      }
    }
    
    setLastTap(now);
  };

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
      ? <p className="text-center py-8">No favorite exercises</p>
      : null;
  }

  const handleSlideChange = (swiper) => {
    setActiveSlideIndex(swiper.activeIndex);
    if (onSlideChange) {
      onSlideChange(swiper.activeIndex);
    }
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
            video: ex.video,
            poster: ex.poster,
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

      <div className="bg-black p-4 rounded-xl relative z-0">
        <div className="relative">
        {/* Slider view - рендерим сразу для предзагрузки */}
        {sliderMounted && (
          <div
            className={`transition-all duration-300 ease-out ${
              effectiveViewMode === "slider" 
                ? "opacity-100 translate-y-0 relative z-10" 
                : "opacity-0 pointer-events-none absolute inset-0 z-0"
            }`}
            onClick={handleDoubleTap}
          >
            <Swiper
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                handleSlideChange(swiper);
              }}
              onSlideChange={handleSlideChange}
              modules={[Navigation]}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              navigation
              grabCursor
              speed={400}
            >
            {videos.map((ex, index) => {
              // Баланс: первые 5 + текущие соседние всегда готовы
              const isInitial = index < 5;
              const isNearActive = Math.abs(index - activeSlideIndex) <= 1;
              const shouldFullyLoad = isInitial || isNearActive;
              
              return (
                <SwiperSlide key={ex.id || ex.exerciseId}>
                  <ExerciseCard
                    ex={ex}
                    isFavorite={favorites.some(f => 
                    f.id === ex.id || 
                    f.exerciseId === ex.id || 
                    f.exerciseId === ex.exerciseId ||
                    f.id === ex.exerciseId
                  )}
                    onToggleFavorite={handleFavoriteClick}
                    readOnly={readOnly}
                    showRemoveButton={mode === "favorites-page"}
                    isActive={index === activeSlideIndex}
                    eager={shouldFullyLoad}
                    preloadLevel={shouldFullyLoad ? "auto" : "none"}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>
          </div>
        )}

        {/* Grid view */}
        <div 
          ref={gridRef}
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300 ease-out ${
            effectiveViewMode === "grid" 
              ? "opacity-100 translate-y-0 relative z-10" 
              : "opacity-0 pointer-events-none absolute inset-0 z-0"
          }`}
        >
            {videos.map((ex, index) => (
              <div
                key={ex.id || ex.exerciseId}
                data-exercise-index={index}
                style={{
                  animation: hasAnimated ? 'none' : `fadeInUp 0.6s ease-out ${index * 0.15}s both`
                }}
                onClick={() => {
                  if (onExerciseClick) {
                    onExerciseClick(index);
                  }
                }}
                className={onExerciseClick ? "cursor-pointer" : ""}
              >
                <ExerciseCard
                  ex={ex}
                  isFavorite={favorites.some(f => 
                    f.id === ex.id || 
                    f.exerciseId === ex.id || 
                    f.exerciseId === ex.exerciseId ||
                    f.id === ex.exerciseId
                  )}
                  onToggleFavorite={handleFavoriteClick}
                  readOnly={readOnly}
                  showRemoveButton={mode === "favorites-page"}
                  eager={index < 6}
                  preloadLevel={index < 6 ? "metadata" : "none"}
                />
              </div>
            ))}
        </div>
        </div>
      </div>
    </div>
  );
}