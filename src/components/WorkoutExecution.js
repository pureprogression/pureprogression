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

      {/* Safe zone сверху */}
      <div className="pt-16">
        {/* Прогресс */}
        <div className="max-w-[1200px] mx-auto p-4 mb-6">
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Видео на полную ширину с информацией поверх */}
        <div className="relative">
          <video
            className="w-full h-[70vh] md:h-[80vh] object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={`/${currentExercise.video}`} type="video/mp4" />
          </video>
          
          {/* Минималистичная информация поверх видео */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="text-white">
              {/* Название упражнения */}
              <h2 className="text-2xl md:text-3xl font-bold mb-3 drop-shadow-lg">
                {currentExercise.title}
              </h2>
              
              {/* Подходы и повторения - минималистично */}
              <div className="flex items-center space-x-6 text-lg md:text-xl font-medium drop-shadow-lg">
                <span>{currentSet}/{currentExercise.sets}</span>
                <span>{currentExercise.reps}</span>
              </div>
            </div>
          </div>
          
          {/* Градиент для лучшей читаемости текста */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>

        {/* Кнопки действий */}
        <div className="max-w-[1200px] mx-auto p-4 mt-6">
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