"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { useRouter } from "next/navigation";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WorkoutsList({ workouts, user }) {
  const router = useRouter();
  const { language } = useLanguage();
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
    <div className="space-y-4" onWheel={stopPreview}>
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 md:p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer relative touch-pan-y"
          onClick={() => handleStartWorkout(workout)}
          onTouchStart={() => handleLongPressStart(workout.id)}
          onTouchEnd={handleLongPressEnd}
          onTouchCancel={handleLongPressEnd}
          onMouseEnter={() => { if (!isTouchDevice) startPreview(workout.id); }}
          onMouseLeave={stopPreview}
          onWheel={stopPreview}
          style={{
            transform: swipedWorkout?.id === workout.id ? `translateX(${swipeOffset}px)` : 'translateX(0)',
            opacity: swipedWorkout?.id === workout.id ? swipeOpacity : 1,
            transition: swipedWorkout?.id === workout.id && Math.abs(swipeOffset) < window.innerWidth ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease-out',
            touchAction: 'pan-y'
          }}
        >

          {/* Заголовок и дата (тач-зона для открытия/закрытия слайдера) */}
          <div
            className="flex justify-between items-start mb-3 md:mb-4 select-none cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleStartWorkout(workout);
            }}
            role="button"
          >
            <div className="cursor-pointer">
              <h3 className="text-white text-xl font-semibold mb-1">{workout.name}</h3>
              {workout.description && (
                <p className="text-gray-300 text-sm">{workout.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs px-2 py-1 rounded-lg">
                <span>• {workout.exercises?.length || 0} ex</span>
                <span className="text-white/30">|</span>
                <span>{workout.createdAt?.toDate ? 
                  workout.createdAt.toDate().toLocaleDateString('ru-RU') : 
                  'Recently'}</span>
              </div>
            </div>
          </div>

          {/* Триптих-превью или встроенный слайдер видео при тапе */}
          {workout.exercises && workout.exercises.length > 0 && (
            <div className="mb-3 md:mb-4">
              {activeSliderFor === workout.id ? (
                <div className="relative rounded-xl overflow-hidden bg-white/5 h-32 md:h-48" onClick={(e)=>{ e.stopPropagation(); setActiveSliderFor(null); }}>
                  <Swiper
                    spaceBetween={8}
                    slidesPerView={1}
                    onSlideChange={handleSliderChange}
                    onSwiper={handleSliderChange}
                  >
                    {workout.exercises.map((ex, idx) => (
                      <SwiperSlide key={idx}>
                        <div className="relative w-full h-32 md:h-48">
                          <video
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            src={ex.video}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={(e) => { e.stopPropagation(); setActiveSliderFor(workout.id); setActiveSlideIndex(0); }}
                >
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
                    <div className="absolute bottom-2 right-2 text-white/80 text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                      View & swipe
                    </div>
                  </div>
                </button>
              )}
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

        </div>
      ))}

    </div>
  );
}
