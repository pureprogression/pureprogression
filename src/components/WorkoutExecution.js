"use client";

import { useState, useEffect } from "react";

export default function WorkoutExecution({ workout, onComplete, onCancel, isSaving }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutResults, setWorkoutResults] = useState({
    exercises: []
  });
  const [startTime, setStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [actualSets, setActualSets] = useState(0);
  const [actualReps, setActualReps] = useState(0);

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
      
      // Инициализируем значения для первого упражнения
      const firstExercise = initialResults.exercises[0];
      if (firstExercise) {
        setActualSets(firstExercise.sets || 3);
        setActualReps(firstExercise.reps || 12);
      }
    }
  }, [workout]);

  const currentExercise = workoutResults.exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / workoutResults.exercises.length) * 100;

  // Принудительное обновление видео при смене упражнения
  useEffect(() => {
    if (!currentExercise) return;
    
    // Обновляем значения при смене упражнения
    setActualSets(currentExercise.sets || 3);
    setActualReps(currentExercise.reps || 12);
    
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
    
    // Сохраняем фактические данные
    exercise.actualSets = actualSets;
    exercise.actualReps = actualReps;
    exercise.completedSets = actualSets;
    
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
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 drop-shadow-lg">
                    {currentExercise.title}
                  </h2>
                  
                  {/* Инлайн редактирование подходов и повторений */}
                  <div className="flex items-center space-x-6 text-lg md:text-xl font-medium drop-shadow-lg">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={actualSets}
                        onChange={(e) => setActualSets(parseInt(e.target.value) || 0)}
                        className="w-14 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg px-2 py-1 text-center font-medium focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                        min="0"
                        max="50"
                      />
                      <span>подходов</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={actualReps}
                        onChange={(e) => setActualReps(parseInt(e.target.value) || 0)}
                        className="w-14 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg px-2 py-1 text-center font-medium focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all duration-300"
                        min="0"
                        max="100"
                      />
                      <span>повторений</span>
                    </div>
                  </div>
                </div>

                {/* Кнопка завершения упражнения - без подложки */}
                <button
                  onClick={handleCompleteExercise}
                  className="group flex items-center justify-center w-14 h-14 hover:bg-white/10 rounded-full transition-all duration-300 ease-out hover:scale-110 active:scale-95 relative z-10 cursor-pointer"
                  aria-label="Завершить упражнение"
                  style={{ pointerEvents: 'auto' }}
                >
                  <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Градиент для лучшей читаемости текста */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
          </div>

        </div>
      );
    }