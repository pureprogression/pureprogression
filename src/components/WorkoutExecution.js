"use client";

import { useState, useEffect } from "react";

export default function WorkoutExecution({ workout, onComplete, onCancel, isSaving }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutResults, setWorkoutResults] = useState({
    exercises: []
  });
  const [startTime, setStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

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
        
        // Сохраняем реальные данные
        const completedReps = exercise.completedReps || [];
        const actualReps = completedReps.filter(reps => reps > 0);
        const actualSets = actualReps.length;
        
        exercise.actualSets = actualSets;
        exercise.actualReps = actualReps;
        exercise.completedSets = actualSets;
        exercise.totalReps = actualReps.reduce((sum, reps) => sum + reps, 0);
        
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

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-3xl font-bold mb-4">Тренировка завершена! 🎉</div>
          <div className="text-gray-400 mb-6">Сохранение результатов...</div>
          <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"></div>
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
    <div className="min-h-screen bg-black text-white">
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

          {/* Видео на полную ширину с информацией и кнопками поверх */}
          <div className="relative">
            <video
              key={`${currentExerciseIndex}-${currentExercise.id}`}
              className="w-full h-[100vh] object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={`/${currentExercise.video}`} type="video/mp4" />
            </video>
            
            {/* Прогресс-бар сверху */}
            <div className="absolute top-16 left-4 right-4">
              <div className="w-full bg-white/20 rounded-full h-1">
                <div 
                  className="bg-white h-1 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Минималистичная информация поверх видео */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  {/* Название упражнения */}
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">
                    {currentExercise.title}
                  </h2>
                  
                  {/* Интерактивные подходы */}
                  <div className="flex items-center space-x-3 mb-2">
                    {Array.from({ length: currentExercise.sets || 3 }, (_, index) => {
                      const completedReps = currentExercise.completedReps || [];
                      const reps = completedReps[index] || 0;
                      const targetReps = currentExercise.reps || 12;
                      
                      return (
                        <div key={index} className="flex items-center space-x-1">
                          {/* Номер подхода */}
                          <span className="text-xs text-white/70 w-3">
                            {index + 1}
                          </span>
                          
                          {/* Счетчик повторений */}
                          <button
                            onClick={() => {
                              const updatedResults = { ...workoutResults };
                              const exercise = updatedResults.exercises[currentExerciseIndex];
                              
                              if (!exercise.completedReps) {
                                exercise.completedReps = Array(exercise.sets || 3).fill(0);
                              }
                              
                              if (exercise.completedReps[index] < targetReps) {
                                exercise.completedReps[index]++;
                              }
                              
                              setWorkoutResults(updatedResults);
                            }}
                            className="flex items-center justify-center w-8 h-6 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-all duration-200 hover:scale-105"
                          >
                            {reps}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Целевые повторения */}
                  <div className="text-xs text-white/60 drop-shadow-lg">
                    Цель: {currentExercise.reps || 12} повторений в подходе
                  </div>
                </div>

                {/* Кнопка завершения упражнения */}
                <button
                  onClick={handleCompleteExercise}
                  className="group flex items-center justify-center w-12 h-12 hover:bg-white/10 rounded-full transition-all duration-300 ease-out hover:scale-110 active:scale-95 relative z-10 cursor-pointer"
                  aria-label="Завершить упражнение"
                  style={{ pointerEvents: 'auto' }}
                >
                  <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Градиент для лучшей читаемости текста */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
          </div>

        </div>
      );
    }