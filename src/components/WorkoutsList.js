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
    const ok = typeof window !== 'undefined' ? window.confirm('Delete this workout?') : false;
    if (!ok) return;
    try {
      if (navigator.vibrate) navigator.vibrate(100);
      await deleteDoc(doc(db, 'workouts', workoutId));
      localStorage.removeItem(`workout_${workoutId}`);
      window.location.reload();
    } catch (error) {
      console.error("Ошибка при удалении тренировки:", error);
    }
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
      className="space-y-4" 
      onWheel={stopPreview}
      {...containerAnimation}
    >
      <AnimatePresence>
        {workouts.map((workout, index) => (
          <motion.div
            key={workout.id}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer relative touch-pan-y"
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

          {/* Пустое пространство для отступа */}
          <div className="mb-3 md:mb-4" />

          {/* Триптих-превью только с картинками */}
          {workout.exercises && workout.exercises.length > 0 && (
            <div className="mb-3 md:mb-4">
              <div className="relative rounded-xl overflow-hidden bg-white/5">
                {(() => {
                  const total = workout.exercises.length || 0;
                  const columns = total <= 3 ? total : (total <= 6 ? 3 : 4);
                  return (
                    <div
                      className="grid gap-1 h-32 md:h-48"
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
                  );
                })()}
              </div>
              
              {/* Название и дата под изображениями */}
              <div className="mt-2 flex items-center justify-between">
                <div className="min-w-0 pr-3">
                  <h3 className="text-white text-sm font-medium truncate">{workout.name}</h3>
                </div>
                <div className="shrink-0 inline-flex items-center gap-2 bg-white/10 text-white/70 text-xs px-2 py-1 rounded-lg">
                  <span>{workout.exercises?.length || 0} ex</span>
                  <span className="text-white/30">|</span>
                  <span>{workout.createdAt?.toDate ? 
                    workout.createdAt.toDate().toLocaleDateString('ru-RU') : 
                    'Recently'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Индикатор удаления при swipe */}
          {swipedWorkout?.id === workout.id && swipeOffset < -60 && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="text-white/80 text-sm font-medium">
                Delete
              </div>
            </div>
          )}

          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
