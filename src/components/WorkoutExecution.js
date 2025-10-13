"use client";

import { useState, useEffect } from "react";

export default function WorkoutExecution({ workout, onComplete, onCancel, isSaving }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutResults, setWorkoutResults] = useState({
    exercises: []
  });
  const [startTime, setStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Инициализация результатов
  useEffect(() => {
    if (workout && workout.exercises) {
      const initialResults = {
        exercises: workout.exercises.map(exercise => ({
          ...exercise,
          completedSets: 0,
          sets: exercise.sets || 3,
          reps: exercise.reps || 12
        }))
      };
      setWorkoutResults(initialResults);
      setStartTime(Date.now());
    }
  }, [workout]);

  const currentExercise = workoutResults.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / workoutResults.exercises.length) * 100;

  // Принудительное обновление видео при смене упражнения
  useEffect(() => {
    if (!currentExercise) return;
    
    // Небольшая задержка для корректного обновления видео
    const timer = setTimeout(() => {
      const video = document.querySelector('video');
      if (video) {
        video.load();
        video.play().catch(console.error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentExerciseIndex, currentExercise]);

  const handleCompleteExercise = () => {
    if (!currentExercise) return;

    const updatedResults = { ...workoutResults };
    const exercise = updatedResults.exercises[currentExerciseIndex];
    
    // Отмечаем упражнение как выполненное с исходными значениями
    exercise.actualSets = exercise.sets || 3;
    exercise.actualReps = exercise.reps || 12;
    exercise.completedSets = exercise.sets || 3;
    
    setWorkoutResults(updatedResults);

    // Переходим к следующему упражнению или завершаем тренировку
    if (currentExerciseIndex < workoutResults.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = () => {
    const finalResults = {
      ...workoutResults
    };
    
    setIsCompleted(true);
    onComplete(finalResults);
  };

  // Функции навигации
      const goToNextExercise = () => {
        if (currentExerciseIndex < workoutResults.exercises.length - 1) {
          setCurrentExerciseIndex(currentExerciseIndex + 1);
        } else {
          // Завершаем тренировку
          handleCompleteWorkout();
        }
      };

  const goToPreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  // Обработчики свайпов
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNextExercise();
    } else if (isRightSwipe) {
      goToPreviousExercise();
    }
  };

  // Обработчики клавиатуры
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousExercise();
      } else if (e.key === 'ArrowRight') {
        goToNextExercise();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentExerciseIndex, workoutResults.exercises.length, goToNextExercise, goToPreviousExercise]);

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-2 tracking-wide">
            Workout Complete
          </h1>
          <div className="text-gray-400 text-sm">
            Saving results...
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Ошибка загрузки упражнения</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white overflow-hidden">
      {/* Крестик для выхода - на уровне меню */}
      <button
        onClick={onCancel}
        className="fixed top-4 right-4 z-50 p-3 text-white hover:bg-white/10 transition-all duration-300 ease-out focus:outline-none rounded-lg"
        aria-label="Выход из тренировки"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Основной контейнер */}
      <div className="flex flex-col md:flex-row h-full">
        {/* Видео контейнер */}
        <div 
          className="relative flex-1 md:flex-none md:w-1/2"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Навигационные стрелки для десктопа */}
          {currentExerciseIndex > 0 && (
            <button
              onClick={goToPreviousExercise}
              className="hidden md:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full items-center justify-center transition-all duration-300"
              aria-label="Предыдущее упражнение"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {currentExerciseIndex < workoutResults.exercises.length - 1 && (
            <button
              onClick={goToNextExercise}
              className="hidden md:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full items-center justify-center transition-all duration-300"
              aria-label="Следующее упражнение"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <video
            key={`${currentExerciseIndex}-${currentExercise.id}`}
            src={currentExercise.video}
            className="w-full h-full object-cover md:object-contain"
            autoPlay
            muted
            loop
            playsInline
          />

          {/* Мобильная информация поверх видео */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white">
                <h2 className="text-lg font-medium mb-1 drop-shadow-lg">
                  {currentExercise.title}
                </h2>
                <div className="flex items-center space-x-3 text-sm font-medium drop-shadow-lg opacity-90">
                  <span>{currentExercise.sets || 3}</span>
                  <span>•</span>
                  <span>{currentExercise.reps || 12}</span>
                </div>
              </div>
              <button
                onClick={handleCompleteExercise}
                className="group flex items-center justify-center w-12 h-12 hover:bg-white/10 rounded-full transition-all duration-300 ease-out hover:scale-110 active:scale-95 relative z-10 cursor-pointer"
                aria-label="Завершить упражнение"
                style={{ pointerEvents: 'auto' }}
              >
                <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-sm font-medium">
                {currentExerciseIndex + 1} / {workoutResults.exercises.length}
              </span>
              <span className="text-white/70 text-sm font-medium">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-white h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Градиент для мобильной версии */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        </div>

        {/* Десктопная панель информации */}
        <div className="hidden md:flex md:w-1/2 md:flex-col md:justify-center md:items-center md:p-8 md:bg-black/20">
          <div className="w-full max-w-md space-y-8">
            {/* Название упражнения */}
            <div>
              <h2 className="text-4xl font-bold text-white mb-4">
                {currentExercise.title}
              </h2>
              <div className="flex items-center space-x-4 text-2xl font-medium text-white/90">
                <span>{currentExercise.sets || 3} подходов</span>
                <span>•</span>
                <span>{currentExercise.reps || 12} повторений</span>
              </div>
            </div>

            {/* Прогресс */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-white/70">
                <span className="text-lg font-medium">
                  Упражнение {currentExerciseIndex + 1} из {workoutResults.exercises.length}
                </span>
                <span className="text-lg font-medium">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

          </div>
        </div>
      </div>
        {/* Подсказка для навигации */}
        <div className="hidden md:block absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white/80 text-sm">
              {currentExerciseIndex < workoutResults.exercises.length - 1 
                ? "Используйте стрелки или клавиши ← → для навигации" 
                : "→ для завершения тренировки"
              }
            </p>
          </div>
        </div>


        </div>
      );
    }