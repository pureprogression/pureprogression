"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export default function WorkoutsList({ workouts, user, onWorkoutDeleted }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);
  const [swipedWorkout, setSwipedWorkout] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeOpacity, setSwipeOpacity] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState(null);

  const handleDeleteWorkout = async (workoutId, workoutName) => {
    console.log("🔥 handleDeleteWorkout вызван для:", workoutId, workoutName);
    
    // Показываем кастомный диалог подтверждения
    setShowDeleteConfirm({ id: workoutId, name: workoutName });
  };

  const confirmDelete = async () => {
    const { id: workoutId, name: workoutName } = showDeleteConfirm;
    
    console.log("🔥 Подтверждено удаление тренировки:", workoutId);
    setDeletingId(workoutId);
    setDeletingWorkoutId(workoutId); // Начинаем анимацию исчезновения
    setShowDeleteConfirm(null);
    
    try {
      await deleteDoc(doc(db, 'workouts', workoutId));
      console.log("🔥 Тренировка удалена:", workoutId);
      
      // Удаляем из localStorage кэша
      localStorage.removeItem(`workout_${workoutId}`);
      console.log("🔥 Тренировка удалена из кэша:", workoutId);
      
      // Ждем завершения анимации исчезновения, затем уведомляем родительский компонент
      setTimeout(() => {
        if (onWorkoutDeleted) {
          onWorkoutDeleted(workoutId);
        }
        setDeletingWorkoutId(null);
      }, 300); // Время анимации
    } catch (error) {
      console.error("🔥 Ошибка при удалении тренировки:", error);
      alert("Ошибка при удалении тренировки");
      setDeletingWorkoutId(null);
    } finally {
      setDeletingId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleStartWorkout = (workout) => {
    console.log("Запуск тренировки:", workout);
    console.log("ID тренировки:", workout.id);
    
    // Проверяем, что тренировка существует и имеет упражнения
    if (!workout || !workout.id || !workout.exercises || workout.exercises.length === 0) {
      alert("Тренировка повреждена или не содержит упражнений");
      return;
    }
    
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
    console.log("🔥 Touch start для тренировки:", workoutId, "X:", touch.clientX);
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
    console.log("🔥 Swipe завершен. Offset:", swipeOffset, "Threshold:", threshold);
    
    if (swipeOffset < threshold) {
      console.log("🔥 Swipe превысил порог, удаляем тренировку:", workoutId);
      // Удаляем тренировку
      const workout = workouts.find(w => w.id === workoutId);
      if (workout) {
        handleDeleteWorkout(workoutId, workout.name);
      }
    } else {
      console.log("🔥 Swipe не превысил порог, тренировка не удаляется");
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
            opacity: swipedWorkout?.id === workout.id ? swipeOpacity : (deletingWorkoutId === workout.id ? 0 : 1),
            transition: swipedWorkout?.id === workout.id && Math.abs(swipeOffset) < 400 ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
          }}
        >
          {/* Кнопки действий */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            {/* Кнопка редактирования */}
            <button
              onClick={(e) => handleEditWorkout(e, workout)}
              className="w-8 h-8 text-white/60 hover:text-white transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Кнопка удаления */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteWorkout(workout.id, workout.name);
              }}
              disabled={deletingId === workout.id}
              className="w-8 h-8 text-red-400/60 hover:text-red-400 transition-all duration-300 disabled:opacity-50"
            >
              {deletingId === workout.id ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Заголовок и дата */}
          <div className="flex justify-between items-start mb-4 pr-20">
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

          {/* Индикатор удаления при свайпе */}
          {swipedWorkout?.id === workout.id && swipeOffset < -60 && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl">
              <div className="text-red-400 text-center">
                <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <div className="text-xs font-medium">
                  {swipeOffset < -120 ? "Отпустите для удаления" : "Продолжайте для удаления"}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Диалог подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-white/20">
            <div className="text-center">
              {/* Иконка корзины */}
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className="text-white text-lg font-semibold mb-2">Удалить тренировку?</h3>
              <p className="text-gray-300 text-sm mb-6">
                Тренировка <span className="text-white font-medium">"{showDeleteConfirm.name}"</span> будет удалена навсегда.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-white/10 text-white py-3 px-4 rounded-lg font-medium hover:bg-white/20 transition-all duration-300"
                >
                  Отмена
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-all duration-300"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
