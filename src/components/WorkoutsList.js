"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WorkoutsList({ workouts, user }) {
  const router = useRouter();
  const { language } = useLanguage();
  const [swipedWorkout, setSwipedWorkout] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeOpacity, setSwipeOpacity] = useState(1);


  const handleStartWorkout = (workout) => {
    // Проверяем, что тренировка существует и имеет упражнения
    if (!workout || !workout.id || !workout.exercises || workout.exercises.length === 0) {
      console.log("Workout is corrupted or contains no exercises");
      return;
    }
    
    router.push(`/workout/${workout.id}`);
  };

  // Функции для swipe удаления
  const handleTouchStart = (e, workoutId) => {
    const touch = e.touches[0];
    setSwipedWorkout({ id: workoutId, startX: touch.clientX });
    setSwipeOffset(0);
    setSwipeOpacity(1);
  };

  const handleTouchMove = (e, workoutId) => {
    if (!swipedWorkout || swipedWorkout.id !== workoutId) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipedWorkout.startX;
    
    // Только движение влево - полностью блокируем движение вправо
    if (deltaX < 0) {
      const offset = Math.max(-120, deltaX); // Ограничиваем смещение
      setSwipeOffset(offset);
      
      // Fade эффект при приближении к порогу удаления
      if (offset < -60) {
        const fadeProgress = Math.min(1, Math.abs(offset + 60) / 60); // 0-1 от -60 до -120
        const opacity = Math.max(0.3, 1 - fadeProgress * 0.7); // от 1 до 0.3
        setSwipeOpacity(opacity);
      } else {
        setSwipeOpacity(1);
      }
    }
    // Полностью убираем возможность движения вправо
  };

  const handleTouchEnd = async (e, workoutId) => {
    if (!swipedWorkout || swipedWorkout.id !== workoutId) return;
    
    // Если смещение больше 60px, сразу удаляем тренировку
    if (swipeOffset < -60) {
      // Вибрация для подтверждения
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      // Сразу уводим карточку за границу экрана без возврата
      setSwipeOffset(-window.innerWidth);
      setSwipeOpacity(0);
      
      // Удаляем тренировку через 400ms, когда анимация завершится
      setTimeout(async () => {
        try {
          // Полностью удаляем документ из Firebase
          await deleteDoc(doc(db, 'workouts', workoutId));
          
          // Удаляем из localStorage кэша
          localStorage.removeItem(`workout_${workoutId}`);
          
          // Перезагружаем страницу для обновления списка
          window.location.reload();
        } catch (error) {
          console.error("Ошибка при удалении тренировки:", error);
          console.log("Ошибка при удалении тренировки");
        }
      }, 400);
      
      // Сбрасываем состояние после анимации
      setTimeout(() => {
        setSwipedWorkout(null);
        setSwipeOpacity(1);
      }, 400);
      
      return;
    } else if (swipeOffset < -30) {
      // Если сдвинули достаточно далеко, но не дошли до порога - тоже улетает
      setSwipeOffset(-window.innerWidth);
      setSwipeOpacity(0);
      
      setTimeout(() => {
        setSwipedWorkout(null);
        setSwipeOpacity(1);
      }, 400);
      
      return;
    } else {
      // Возвращаем карточку в исходное положение только если не сдвинули достаточно
      setSwipeOffset(0);
      setSwipeOpacity(1);
      setSwipedWorkout(null);
    }
  };


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
    <div className="space-y-4">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer relative"
          onClick={() => handleStartWorkout(workout)}
          onTouchStart={(e) => handleTouchStart(e, workout.id)}
          onTouchMove={(e) => handleTouchMove(e, workout.id)}
          onTouchEnd={(e) => handleTouchEnd(e, workout.id)}
          style={{
            transform: swipedWorkout?.id === workout.id ? `translateX(${swipeOffset}px)` : 'translateX(0)',
            opacity: swipedWorkout?.id === workout.id ? swipeOpacity : 1,
            transition: swipedWorkout?.id === workout.id && Math.abs(swipeOffset) < window.innerWidth ? 'none' : 'transform 0.4s ease-out, opacity 0.4s ease-out'
          }}
        >

          {/* Заголовок и дата */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-white text-xl font-semibold mb-1">{workout.name}</h3>
              {workout.description && (
                <p className="text-gray-300 text-sm">{workout.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">
                {workout.exercises?.length || 0} exercises
              </div>
              <div className="text-gray-500 text-xs">
                {workout.createdAt?.toDate ? 
                  workout.createdAt.toDate().toLocaleDateString('ru-RU') : 
                  'Recently'
                }
              </div>
            </div>
          </div>

          {/* Превью упражнений */}
          {workout.exercises && workout.exercises.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {workout.exercises.slice(0, 4).map((exercise, index) => (
                <div key={index} className="flex-shrink-0">
                  <img
                    src={
                      exercise.poster || 
                      exercise.video.replace('/videos/', '/posters/').replace('.mp4', '.jpg')
                    }
                    alt={exercise.title || 'Exercise'}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-800"
                    loading="lazy"
                  />
                </div>
              ))}
              {workout.exercises.length > 4 && (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    +{workout.exercises.length - 4}
                  </span>
                </div>
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
