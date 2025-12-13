"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function WorkoutExecution({ workout, onComplete, onCancel, isSaving }) {
  const router = useRouter();
  const [workoutResults, setWorkoutResults] = useState({
    exercises: []
  });
  const [startTime, setStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid-4', 'large'

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


  const handleCompleteWorkout = () => {
    const finalResults = {
      ...workoutResults
    };
    
    setIsCompleted(true);
    onComplete(finalResults);
  };


  const handleGoToWorkouts = () => {
    // Сохраняем результаты и переходим на страницу тренировок
    handleCompleteWorkout();
    router.push('/my-workouts');
  };

  const handleToggleExercise = (index) => {
    const updatedResults = { ...workoutResults };
    const exercise = updatedResults.exercises[index];
    
    if (exercise.completedSets === undefined || exercise.completedSets === 0) {
      exercise.completedSets = exercise.sets || 3;
      exercise.actualSets = exercise.sets || 3;
      exercise.actualReps = exercise.reps || 12;
    } else {
      exercise.completedSets = 0;
    }
    
    setWorkoutResults(updatedResults);
  };

  const getPosterFromExercise = (exercise) => {
    if (!exercise) return "";
    if (exercise.poster) return exercise.poster;
    if (exercise.video) return exercise.video.replace('/videos/', '/posters/').replace('.mp4', '.jpg');
    return "";
  };

  // Настройки для каждого режима
  const viewModeConfig = useMemo(() => {
    switch (viewMode) {
      case 'list':
        return {
          slidesPerView: 1,
          exercisesPerSlide: 100, // Много упражнений в ряд
          gridCols: 'auto'
        };
      case 'large':
        return {
          slidesPerView: 1,
          exercisesPerSlide: 1,
          gridCols: 1
        };
      case 'grid-4':
        return {
          slidesPerView: 1,
          exercisesPerSlide: 8, // 2 ряда × 4 колонки
          gridCols: 4
        };
      default:
        return {
          slidesPerView: 1,
          exercisesPerSlide: 8,
          gridCols: 4
        };
    }
  }, [viewMode]);
  
  // Разбиваем упражнения на слайды
  const exerciseSlides = useMemo(() => {
    const slides = [];
    const { exercisesPerSlide } = viewModeConfig;
    
    for (let i = 0; i < workoutResults.exercises.length; i += exercisesPerSlide) {
      slides.push(workoutResults.exercises.slice(i, i + exercisesPerSlide));
    }
    
    return slides;
  }, [workoutResults.exercises, viewModeConfig]);

  // Проверяем, все ли упражнения выполнены
  const allExercisesCompleted = workoutResults.exercises.length > 0 && workoutResults.exercises.every(ex => ex.completedSets > 0);

  // Если тренировка завершена, показываем страницу завершения
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white flex items-center justify-center">
              <svg className="w-12 h-12 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-light text-white mb-3 tracking-wide">
              Тренировка выполнена
            </h1>
            <p className="text-white/60 text-sm">
              Отличная работа!
            </p>
          </div>
          
          <button
            onClick={handleGoToWorkouts}
            className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-white/90 transition-all duration-300"
          >
            Вернуться к тренировкам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pt-20">
      {/* Крестик для выхода */}
      <button
        onClick={onCancel}
        className="fixed top-4 right-4 z-50 p-3 text-white hover:bg-white/10 transition-all duration-300 ease-out focus:outline-none rounded-lg"
        aria-label="Выход из тренировки"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Заголовок тренировки, прогресс и переключатель режимов */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{workout.name}</h1>
            {workout.description && (
              <p className="text-white/60 text-sm md:text-base">
                {workout.description}
              </p>
            )}
          </div>
          
          {/* Переключатель режимов просмотра */}
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Список"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('large')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'large'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Крупный вид"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid-4')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid-4'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
              title="4 в ряд"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/70 text-sm">
            {workoutResults.exercises.filter(ex => ex.completedSets > 0).length} / {workoutResults.exercises.length} выполнено
          </span>
          <span className="text-white/70 text-sm">
            {Math.round((workoutResults.exercises.filter(ex => ex.completedSets > 0).length / workoutResults.exercises.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(workoutResults.exercises.filter(ex => ex.completedSets > 0).length / workoutResults.exercises.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Отображение упражнений */}
      <div className="max-w-7xl mx-auto">
        {viewMode === 'list' ? (
          // Режим списка - вертикальный список: слева описание, справа карточка с видео
          <div className="space-y-4">
            {workoutResults.exercises.map((exercise, index) => {
              const isCompleted = exercise.completedSets > 0;
              
              return (
                <div
                  key={exercise.id || index}
                  onClick={() => handleToggleExercise(index)}
                  className={`bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    isCompleted ? 'ring-1 ring-green-500/50 bg-green-500/10' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-row items-center gap-3 p-2 md:p-2.5">
                    {/* Левая часть - название, подходы, повторения */}
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white/40 text-xs font-medium">#{index + 1}</span>
                        <h3 className={`text-white font-semibold text-sm md:text-base ${isCompleted ? 'text-green-400' : ''}`}>
                          {exercise.title}
                        </h3>
                      </div>
                      {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {exercise.muscleGroups.slice(0, 3).map((group, idx) => (
                            <span
                              key={idx}
                              className="text-white/50 text-xs px-1 py-0.5 rounded bg-white/5"
                            >
                              {group}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <span>{exercise.sets || 3} подходов</span>
                        <span>•</span>
                        <span>{exercise.reps || 12} повторений</span>
                      </div>
                    </div>

                    {/* Правая часть - карточка с видео (подогнана под высоту текста) */}
                    <div className="w-20 md:w-24 h-20 md:h-24 flex-shrink-0 relative rounded-lg overflow-hidden">
                      <video
                        src={exercise.video}
                        poster={getPosterFromExercise(exercise)}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                      {isCompleted && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : exerciseSlides.length > 0 ? (
          // Режимы grid-4 и large - Swiper как в конструкторе
          <div className={viewMode === 'large' ? 'w-full' : ''}>
            <Swiper
              modules={[Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              centeredSlides={viewMode === 'large'}
              pagination={{
                clickable: true,
              }}
              className={`!pb-8 w-full workout-builder-swiper ${viewMode === 'large' ? 'workout-builder-swiper-large' : ''}`}
            >
            {exerciseSlides.map((slideExercises, slideIndex) => (
              <SwiperSlide key={slideIndex} className={viewMode === 'large' ? 'workout-builder-large' : ''}>
                <div className={`gap-2 md:gap-4 transition-all duration-300 ${
                  viewMode === 'large' 
                    ? 'grid grid-cols-1 w-full md:max-w-md md:mx-auto p-2'
                    : 'grid grid-cols-4 p-1 overflow-visible'
                }`}>
                  {slideExercises.map((exercise, exerciseIndex) => {
                    // Находим реальный индекс упражнения в общем массиве
                    const realIndex = slideIndex * viewModeConfig.exercisesPerSlide + exerciseIndex;
                    const isCompleted = exercise.completedSets > 0;
                    
                    return (
                      <div
                        key={exercise.id || realIndex}
                        onClick={() => handleToggleExercise(realIndex)}
                        className={`relative rounded-xl cursor-pointer group transition-all duration-300 ${
                          viewMode === 'large' 
                            ? 'aspect-[9/16] max-h-[80vh]'
                            : 'aspect-[9/16] overflow-visible'
                        } ${
                          isCompleted ? 'ring-1 ring-green-500 ring-offset-1 ring-offset-black' : 'hover:ring-1 hover:ring-white/30'
                        }`}
                        style={{ padding: isCompleted ? '4px' : '0' }}
                      >
                        <div className={`w-full h-full rounded-xl overflow-hidden ${viewMode === 'large' ? 'relative' : ''}`}>
                        {/* Видео - обертка с overflow-hidden */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
                          <video
                            src={exercise.video}
                            poster={getPosterFromExercise(exercise)}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        </div>
                        
                        {/* Информация об упражнении для режима grid-4 - убрана */}
                        
                        {/* Информация об упражнении для режима large */}
                        {viewMode === 'large' && (
                          <div className="absolute bottom-0 left-0 right-0 p-3 pb-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-10" style={{ marginBottom: isCompleted ? '4px' : '0' }}>
                            <h3 className={`text-white font-medium text-sm mb-2 line-clamp-2 ${isCompleted ? 'text-green-400' : ''}`}>
                              {exercise.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-white/70 mb-2">
                              <span>{exercise.sets || 3} подходов</span>
                              <span>•</span>
                              <span>{exercise.reps || 12} повторений</span>
                            </div>
                            {/* Кнопка завершения тренировки в режиме large */}
                            {allExercisesCompleted && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGoToWorkouts();
                                }}
                                className="w-full bg-white text-black py-2 px-4 rounded-lg font-medium hover:bg-white/90 transition-all duration-300 mt-2"
                              >
                                Завершить тренировку
                              </button>
                            )}
                          </div>
                        )}

                        {/* Галочка убрана для всех режимов */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-white/60">Нет упражнений</p>
          </div>
        )}
      </div>

      {/* Кнопка завершения тренировки для режимов list и grid-4 */}
      {allExercisesCompleted && viewMode !== 'large' && (
        <div className="max-w-7xl mx-auto mt-6 flex justify-center">
          <button
            onClick={handleGoToWorkouts}
            disabled={isSaving}
            className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : 'Завершить тренировку'}
          </button>
        </div>
      )}
    </div>
  );
    }