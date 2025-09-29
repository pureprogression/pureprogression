"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export default function WorkoutsList({ workouts, user }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);
  const [swipedWorkout, setSwipedWorkout] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeOpacity, setSwipeOpacity] = useState(1);

  const handleDeleteWorkout = async (workoutId, workoutName) => {
    if (!confirm(`Удалить тренировку "${workoutName}"?`)) {
      return;
    }

    setDeletingId(workoutId);
    
    try {
      await deleteDoc(doc(db, 'workouts', workoutId));
      console.log("Тренировка удалена");
    } catch (error) {
      console.error("Ошибка при удалении тренировки:", error);
      alert("Ошибка при удалении тренировки");
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartWorkout = (workout) => {
    // TODO: Реализовать запуск тренировки
    console.log("Запуск тренировки:", workout.name);
    router.push(`/workout/${workout.id}`);
  };

  const handleEditWorkout = (e, workout) => {
    e.stopPropagation(); // Предотвращаем запуск тренировки
    // TODO: Реализовать редактирование тренировки
    console.log("Редактирование тренировки:", workout.name);
    alert(`Редактирование тренировки "${workout.name}" - функция в разработке`);
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
    
    // Только движение влево
    if (deltaX < 0) {
      e.preventDefault();
      setSwipeOffset(deltaX);
      
      // Fade эффект при приближении к удалению
      const threshold = -120;
      if (deltaX < threshold) {
        setSwipeOpacity(0.3);
      } else {
        setSwipeOpacity(1 + deltaX / 400); // Плавное изменение прозрачности
      }
    }
  };

  const handleTouchEnd = (e, workoutId) => {
    if (!swipedWorkout || swipedWorkout.id !== workoutId) return;
    
    const threshold = -120;
    
    if (swipeOffset < threshold) {
      // Удаляем тренировку
      const workout = workouts.find(w => w.id === workoutId);
      if (workout) {
        handleDeleteWorkout(workoutId, workout.name);
      }
    }
    
    // Сброс состояния
    setSwipedWorkout(null);
    setSwipeOffset(0);
    setSwipeOpacity(1);
  };

  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">У вас пока нет сохраненных тренировок</div>
        <button
          onClick={() => router.push('/workout-builder')}
          className="bg-white text-black py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
        >
          Создать первую тренировку
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="relative bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          onClick={() => handleStartWorkout(workout)}
          onTouchStart={(e) => handleTouchStart(e, workout.id)}
          onTouchMove={(e) => handleTouchMove(e, workout.id)}
          onTouchEnd={(e) => handleTouchEnd(e, workout.id)}
          style={{
            transform: swipedWorkout?.id === workout.id ? `translateX(${swipeOffset}px)` : 'translateX(0)',
            opacity: swipedWorkout?.id === workout.id ? swipeOpacity : 1,
            transition: swipedWorkout?.id === workout.id && Math.abs(swipeOffset) < 400 ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
          }}
        >
          {/* Кнопка редактирования */}
          <button
            onClick={(e) => handleEditWorkout(e, workout)}
            className="absolute top-4 right-4 w-8 h-8 text-white/60 hover:text-white transition-all duration-300 z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Заголовок и дата */}
          <div className="flex justify-between items-start mb-4 pr-12">
            <div>
              <h3 className="text-white text-xl font-semibold mb-1">{workout.name}</h3>
              {workout.description && (
                <p className="text-gray-300 text-sm">{workout.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">
                {workout.exercises?.length || 0} упражнений
              </div>
              <div className="text-gray-500 text-xs">
                {workout.createdAt?.toDate ? 
                  workout.createdAt.toDate().toLocaleDateString('ru-RU') : 
                  'Недавно'
                }
              </div>
            </div>
          </div>

          {/* Превью упражнений */}
          {workout.exercises && workout.exercises.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {workout.exercises.slice(0, 4).map((exercise, index) => (
                <div key={index} className="flex-shrink-0">
                  <video
                    className="w-16 h-16 rounded-lg object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src={exercise.video} type="video/mp4" />
                  </video>
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

          {/* Индикатор для swipe */}
          <div className="absolute bottom-2 left-2 text-gray-500 text-xs">
            Проведите влево для удаления
          </div>
        </div>
      ))}
    </div>
  );
}
