"use client";

import { useState, useEffect } from "react";

export default function WorkoutExecution({ workout, onComplete, onCancel, isSaving }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutResults, setWorkoutResults] = useState({
    exercises: []
  });
  const [startTime, setStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSets, setEditingSets] = useState([]);

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

  const handleEditSets = () => {
    const currentSets = currentExercise.sets || 3;
    const currentReps = currentExercise.reps || 12;
    
    // Создаем массив подходов для редактирования
    const sets = Array.from({ length: currentSets }, (_, i) => ({
      setNumber: i + 1,
      reps: currentReps
    }));
    
    setEditingSets(sets);
    setShowEditModal(true);
  };

  const handleUpdateSet = (setIndex, newReps) => {
    const updatedSets = [...editingSets];
    updatedSets[setIndex].reps = parseInt(newReps) || 0;
    setEditingSets(updatedSets);
  };

  const handleSaveEditedSets = () => {
    const updatedResults = { ...workoutResults };
    const exercise = updatedResults.exercises[currentExerciseIndex];
    
    // Обновляем данные упражнения с отредактированными подходами
    exercise.actualSets = editingSets.length;
    exercise.actualReps = editingSets.reduce((sum, set) => sum + set.reps, 0);
    exercise.completedSets = editingSets.length;
    exercise.setsData = editingSets; // Сохраняем детальную информацию о подходах
    
    setWorkoutResults(updatedResults);
    setShowEditModal(false);
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
            
            {/* Минималистичная информация поверх видео */}
            <div className="absolute bottom-16 left-0 right-0 p-6">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  {/* Название упражнения */}
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg">
                    {currentExercise.title}
                  </h2>
                  
                  {/* Простые цифры с иконкой редактирования */}
                  <div className="flex items-center space-x-3 text-lg font-medium drop-shadow-lg opacity-90">
                    <span>{currentExercise.sets || 3}</span>
                    <span>•</span>
                    <span>{currentExercise.reps || 12}</span>
                    <button
                      onClick={handleEditSets}
                      className="ml-2 p-1 hover:bg-white/10 rounded-full transition-all duration-200 hover:scale-110"
                      aria-label="Редактировать подходы"
                    >
                      <svg className="w-4 h-4 text-white/70 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
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
            
            {/* Прогресс-бар в самом низу */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="w-full bg-white/20 rounded-full h-1">
                <div 
                  className="bg-white h-1 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            {/* Градиент для лучшей читаемости текста */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
          </div>

          {/* Модальное окно редактирования подходов */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full max-w-md border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white text-xl font-semibold">Редактировать подходы</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-3 mb-6">
                  {editingSets.map((set, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-white/90 text-sm">Подход {set.setNumber}</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={set.reps}
                          onChange={(e) => handleUpdateSet(index, e.target.value)}
                          className="w-20 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-center focus:outline-none focus:border-white/40 transition-colors"
                          min="0"
                          max="999"
                        />
                        <span className="text-white/70 text-sm">повторений</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 px-4 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSaveEditedSets}
                    className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      );
    }