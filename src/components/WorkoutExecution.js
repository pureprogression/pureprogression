"use client";

import { useState, useEffect } from "react";

export default function WorkoutExecution({ workout, onComplete, onCancel, isSaving }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
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

  const handleCompleteSet = () => {
    if (!currentExercise) return;

    const updatedResults = { ...workoutResults };
    const exercise = updatedResults.exercises[currentExerciseIndex];
    
    // Увеличиваем количество выполненных подходов
    exercise.completedSets = (exercise.completedSets || 0) + 1;
    
    setWorkoutResults(updatedResults);

    // Переходим к следующему подходу или упражнению
    if (currentSet < exercise.sets) {
      setCurrentSet(currentSet + 1);
    } else {
      // Упражнение завершено
      if (currentExerciseIndex < workoutResults.exercises.length - 1) {
        // Переходим к следующему упражнению
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
      } else {
        // Тренировка завершена
        handleCompleteWorkout();
      }
    }
  };

  const handleSkipExercise = () => {
    if (currentExerciseIndex < workoutResults.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
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
      {/* Safe zone сверху */}
      <div className="pt-16">
        {/* Заголовок */}
        <div className="bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-[1200px] mx-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-white text-xl font-bold">{workout.name}</h1>
                <p className="text-gray-400 text-sm">
                  Упражнение {currentExerciseIndex + 1} из {workoutResults.exercises.length}
                </p>
              </div>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto p-4">
          {/* Прогресс */}
          <div className="mb-4">
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Текущее упражнение */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Видео */}
              <div className="relative">
                <video
                  className="w-full h-80 md:h-[600px] rounded-lg object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                >
                  <source src={`/${currentExercise.video}`} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
              </div>

              {/* Информация об упражнении */}
              <div className="flex flex-col">
                <h2 className="text-white text-xl font-bold mb-4">{currentExercise.title}</h2>
                
                {/* Статистика подходов и повторений */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-center">
                      <div className="text-white text-sm font-bold mb-0.5">
                        {currentSet} / {currentExercise.sets}
                      </div>
                      <div className="text-gray-400 text-xs">Подход</div>
                    </div>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-2">
                    <div className="text-center">
                      <div className="text-white text-sm font-bold mb-0.5">
                        {currentExercise.reps}
                      </div>
                      <div className="text-gray-400 text-xs">Повторений</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий - ниже видимой области */}
          <div className="space-y-3">
            <button
              onClick={handleCompleteSet}
              className="w-full bg-white text-black py-3 rounded-lg font-bold text-base hover:bg-gray-100 transition-all duration-300"
            >
              Завершить подход
            </button>
            
            <button
              onClick={handleSkipExercise}
              className="w-full bg-white/10 text-white py-2 rounded-lg font-medium hover:bg-white/20 transition-all duration-300"
            >
              Пропустить упражнение
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}