"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useRouter } from "next/navigation";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePerformanceOptimization } from "@/hooks/usePerformanceOptimization";

export default function WorkoutsList({ workouts, user }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { isLowEndDevice, isReducedMotion } = usePerformanceOptimization();
  
  // Удаление теперь по долгому нажатию (swipe отключен)
  const [swipedWorkout, setSwipedWorkout] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeOpacity, setSwipeOpacity] = useState(1);
  const [previewWorkoutId, setPreviewWorkoutId] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeSliderFor, setActiveSliderFor] = useState(null); // workoutId | null
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [deletePressTimer, setDeletePressTimer] = useState(null);
  const [deleteConfirmWorkout, setDeleteConfirmWorkout] = useState(null); // workoutId для подтверждения удаления


  const handleStartWorkout = (workout) => {
    // Проверяем, что тренировка существует и имеет упражнения
    if (!workout || !workout.id || !workout.exercises || workout.exercises.length === 0) {
      console.log("Workout is corrupted or contains no exercises");
      return;
    }
    
    router.push(`/workout/${workout.id}`);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(coarse);
    }
  }, []);

  // Управление видео в слайдере: автовоспроизведение только активного слайда
  const handleSliderChange = (swiper) => {
    setActiveSlideIndex(swiper.activeIndex);
    const slides = swiper.slides || [];
    slides.forEach((slide, idx) => {
      const video = slide.querySelector('video');
      if (!video) return;
      if (idx === swiper.activeIndex) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  };

  // Удаление по долгому зажатию
  const confirmAndDelete = async (workoutId) => {
    setDeleteConfirmWorkout(workoutId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmWorkout) return;
    try {
      if (navigator.vibrate) navigator.vibrate(100);
      await deleteDoc(doc(db, 'workouts', deleteConfirmWorkout));
      localStorage.removeItem(`workout_${deleteConfirmWorkout}`);
      setDeleteConfirmWorkout(null);
      window.location.reload();
    } catch (error) {
      console.error("Ошибка при удалении тренировки:", error);
      setDeleteConfirmWorkout(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmWorkout(null);
  };

  // Helpers
  const getPosterFromExercise = (exercise) => {
    if (!exercise) return "";
    if (exercise.poster) return exercise.poster;
    if (exercise.video) return exercise.video.replace('/videos/', '/posters/').replace('.mp4', '.jpg');
    return "";
  };

  const startPreview = (workoutId) => {
    setPreviewWorkoutId(workoutId);
  };

  const stopPreview = () => {
    setPreviewWorkoutId(null);
  };

  const handleLongPressStart = (workoutId) => {
    // На мобильных: long press = удалить; на десктопе — превью
    if (isTouchDevice) {
      if (deletePressTimer) clearTimeout(deletePressTimer);
      const t = setTimeout(() => confirmAndDelete(workoutId), 800);
      setDeletePressTimer(t);
      return;
    }
    if (longPressTimer) clearTimeout(longPressTimer);
    const t = setTimeout(() => startPreview(workoutId), 350);
    setLongPressTimer(t);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    setLongPressTimer(null);
    if (deletePressTimer) clearTimeout(deletePressTimer);
    setDeletePressTimer(null);
    stopPreview();
  };

  // Останавливаем превью при скролле и смене видимости вкладки
  useEffect(() => {
    const handleScroll = () => {
      if (previewWorkoutId) stopPreview();
    };
    const handleVisibility = () => {
      if (document.hidden && previewWorkoutId) stopPreview();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [previewWorkoutId]);


  // Оптимизированные анимации для слабых устройств (moved before conditional return)
  const containerAnimation = useMemo(() => {
    if (isLowEndDevice || isReducedMotion) {
      return {};
    }
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3 }
    };
  }, [isLowEndDevice, isReducedMotion]);

  const itemAnimation = useMemo(() => {
    if (isLowEndDevice || isReducedMotion) {
      return {};
    }
    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.4, delay: 0, ease: "easeOut" }
    };
  }, [isLowEndDevice, isReducedMotion]);

  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">You don&apos;t have any saved workouts yet</div>
        <button
          onClick={() => router.push('/workout-builder')}
          className="bg-white text-black py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
        >
          Create First Workout
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 gap-4" 
      onWheel={stopPreview}
      {...containerAnimation}
    >
      <AnimatePresence>
        {workouts.map((workout, index) => {
          const total = workout.exercises?.length || 0;
          const columns = total <= 3 ? total : (total <= 6 ? 3 : 4);
          
          return (
          <motion.div
            key={workout.id}
            className="rounded-xl overflow-hidden cursor-pointer relative touch-pan-y bg-gradient-to-b from-black to-white/5"
            onClick={() => handleStartWorkout(workout)}
            onTouchStart={() => handleLongPressStart(workout.id)}
            onTouchEnd={handleLongPressEnd}
            onTouchCancel={handleLongPressEnd}
            onMouseEnter={() => { if (!isTouchDevice) startPreview(workout.id); }}
            onMouseLeave={stopPreview}
            onWheel={stopPreview}
            {...itemAnimation}
            style={{
              transform: swipedWorkout?.id === workout.id ? `translateX(${swipeOffset}px)` : 'translateX(0)',
              opacity: swipedWorkout?.id === workout.id ? swipeOpacity : 1,
              transition: swipedWorkout?.id === workout.id && Math.abs(swipeOffset) < window.innerWidth ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease-out',
              touchAction: 'pan-y'
            }}
          >
            {/* Фото упражнений сверху */}
            {workout.exercises && workout.exercises.length > 0 && (
              <div
                className="w-full h-32 md:h-40 grid gap-1"
                style={{ gridTemplateColumns: `repeat(${columns || 1}, minmax(0, 1fr))` }}
              >
                {workout.exercises.map((ex, i) => (
                  <div key={i} className="relative">
                    <img
                      src={getPosterFromExercise(ex)}
                      alt={ex.title || 'Exercise'}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Текстовая часть снизу на темном фоне */}
            <div className="bg-gradient-to-b from-black to-white/5 p-3 md:p-4">
              {/* Заголовок и кнопка удаления */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-white text-base md:text-lg font-semibold truncate flex-1 min-w-0">
                  {workout.name}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmAndDelete(workout.id);
                  }}
                  className="shrink-0 w-5 h-5 flex items-center justify-center hover:opacity-60 transition-opacity duration-200"
                  title={language === 'ru' ? 'Удалить тренировку' : 'Delete workout'}
                >
                  <svg 
                    className="w-4 h-4 text-white/70" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Дата и количество упражнений */}
              <div className="flex justify-end">
                <div className="inline-flex items-center gap-1.5 text-white/60 text-xs">
                  <span>{workout.exercises?.length || 0} {language === 'ru' ? 'упр' : 'ex'}</span>
                  <span className="text-white/30">•</span>
                  <span>{workout.createdAt?.toDate ? 
                    workout.createdAt.toDate().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US') : 
                    (language === 'ru' ? 'Недавно' : 'Recently')}</span>
                </div>
              </div>
            </div>

            {/* Индикатор удаления при swipe */}
            {swipedWorkout?.id === workout.id && swipeOffset < -60 && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                <div className="text-white/80 text-sm font-medium drop-shadow-lg">
                  Delete
                </div>
              </div>
            )}
          </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Модальное окно подтверждения удаления */}
      <AnimatePresence>
        {deleteConfirmWorkout && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDeleteCancel}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal */}
            <motion.div
              className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-xl p-6 max-w-sm w-full mx-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white text-lg font-semibold mb-2">
                {language === 'ru' ? 'Удалить тренировку?' : 'Delete workout?'}
              </h3>
              <p className="text-white/60 text-sm mb-6">
                {language === 'ru' 
                  ? 'Это действие нельзя отменить. Тренировка будет удалена навсегда.'
                  : 'This action cannot be undone. The workout will be permanently deleted.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 py-2 px-4 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-all duration-300"
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2 px-4 bg-red-500/80 text-white rounded-lg font-medium hover:bg-red-500 transition-all duration-300"
                >
                  {language === 'ru' ? 'Удалить' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
