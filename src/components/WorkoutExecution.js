"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

// Переводы групп мышц
const muscleGroupTranslations = {
  ru: {
    "back": "Спина",
    "arms": "Руки",
    "abs": "Пресс",
    "core": "Кор",
    "legs": "Ноги",
    "glutes": "Ягодицы",
    "shoulders": "Плечи",
    "chest": "Грудь"
  },
  en: {
    "back": "Back",
    "arms": "Arms",
    "abs": "Abs",
    "core": "Core",
    "legs": "Legs",
    "glutes": "Glutes",
    "shoulders": "Shoulders",
    "chest": "Chest"
  }
};

export default function WorkoutExecution({ workout, onComplete, onCancel, isSaving }) {
  const router = useRouter();
  const { language } = useLanguage();
  const [workoutResults, setWorkoutResults] = useState({
    exercises: []
  });
  const [startTime, setStartTime] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'grid-4', 'large'
  const [currentPage, setCurrentPage] = useState(0); // Текущая страница
  const videoRefsRef = useRef(new Map()); // Ref для видео элементов
  const swipeStartRef = useRef(null); // Начальная позиция свайпа
  const swipeContainerRef = useRef(null); // Ref для контейнера страниц

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
      
      // Показываем ring только если видео загружено
      setTimeout(() => {
        const exerciseId = exercise.id || `exercise-${index}`;
        const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
        if (card) {
          card.setAttribute('data-selected', 'true');
          const videoLoaded = card.getAttribute('data-video-loaded') === 'true';
          if (videoLoaded) {
            setTimeout(() => {
              card.setAttribute('data-show-ring', 'true');
              card.offsetHeight;
            }, 50);
          }
        }
      }, 10);
    } else {
      exercise.completedSets = 0;
      
      // Скрываем ring при снятии выделения
      setTimeout(() => {
        const exerciseId = exercise.id || `exercise-${index}`;
        const card = document.querySelector(`[data-exercise-id="${exerciseId}"]`);
        if (card) {
          card.setAttribute('data-show-ring', 'false');
          card.setAttribute('data-selected', 'false');
        }
      }, 10);
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

  // Определяем видимые страницы (текущая ±1)
  const visiblePages = useMemo(() => {
    if (exerciseSlides.length === 0) return [];
    const pages = [];
    for (let i = Math.max(0, currentPage - 1); i <= Math.min(exerciseSlides.length - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, exerciseSlides.length]);

  // Сбрасываем страницу при изменении режима
  useEffect(() => {
    setCurrentPage(0);
  }, [viewMode]);

  // Функции для навигации по страницам
  const goToNextPage = useCallback(() => {
    if (currentPage < exerciseSlides.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, exerciseSlides.length]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Обработчики свайпа для навигации между страницами
  const handlePageSwipeStart = useCallback((e) => {
    swipeStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    };
  }, []);

  const handlePageSwipeMove = useCallback((e) => {
    if (!swipeStartRef.current) return;
    e.preventDefault();
  }, []);

  const handlePageSwipeEnd = useCallback((e) => {
    if (!swipeStartRef.current) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - swipeStartRef.current.x;
    const deltaY = endY - swipeStartRef.current.y;
    const deltaTime = Date.now() - swipeStartRef.current.time;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 300) {
      if (deltaX > 0) {
        goToPrevPage();
      } else {
        goToNextPage();
      }
    }
    
    swipeStartRef.current = null;
  }, [goToNextPage, goToPrevPage]);

  // Intersection Observer для ленивой загрузки видео
  useEffect(() => {
    if (exerciseSlides.length === 0) return;
    
    // Загружаем видео для текущей страницы сразу
    const loadCurrentPage = () => {
      const pageIndex = currentPage;
      if (pageIndex >= 0 && pageIndex < exerciseSlides.length) {
        const pageElement = document.querySelector(`[data-page-index="${pageIndex}"]`);
        if (pageElement) {
          const videos = pageElement.querySelectorAll('video[data-src]');
          videos.forEach(video => {
            const dataSrc = video.getAttribute('data-src');
            if (dataSrc && !video.src) {
              video.src = dataSrc;
              video.load();
              
              const showVideo = () => {
                video.style.opacity = '1';
                const card = video.closest('.exercise-card');
                if (card) {
                  card.style.opacity = '1';
                  card.style.pointerEvents = 'auto';
                  card.setAttribute('data-video-loaded', 'true');
                  
                  // Показываем выделение только после загрузки видео, если упражнение выполнено
                  const isCompleted = card.getAttribute('data-selected') === 'true';
                  if (isCompleted) {
                    setTimeout(() => {
                      card.setAttribute('data-show-ring', 'true');
                      card.offsetHeight; // Принудительный reflow
                    }, 150);
                  }
                }
                video.play().catch(() => {});
              };
              
              // Если видео уже загружено, показываем сразу
              if (video.readyState >= 2) {
                const card = video.closest('.exercise-card');
                if (card) {
                  card.setAttribute('data-video-loaded', 'true');
                  const isCompleted = card.getAttribute('data-selected') === 'true';
                  if (isCompleted) {
                    setTimeout(() => {
                      card.setAttribute('data-show-ring', 'true');
                      card.offsetHeight; // Принудительный reflow
                    }, 100);
                  }
                }
                showVideo();
              } else {
                video.addEventListener('canplay', showVideo, { once: true });
                video.addEventListener('loadeddata', showVideo, { once: true });
              }
            }
          });
        }
      }
    };
    
    loadCurrentPage();
    
    // Intersection Observer для предзагрузки соседних страниц
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const video = entry.target;
            const dataSrc = video.getAttribute('data-src');
            if (dataSrc && !video.src) {
              video.src = dataSrc;
              video.load();
              
              const showVideo = () => {
                video.style.opacity = '1';
                const card = video.closest('.exercise-card');
                if (card) {
                  card.style.opacity = '1';
                  card.style.pointerEvents = 'auto';
                  card.setAttribute('data-video-loaded', 'true');
                  
                  // Показываем выделение только после загрузки видео, если упражнение выполнено
                  const isCompleted = card.getAttribute('data-selected') === 'true';
                  if (isCompleted) {
                    setTimeout(() => {
                      card.setAttribute('data-show-ring', 'true');
                      card.offsetHeight; // Принудительный reflow
                    }, 150);
                  }
                }
                video.play().catch(() => {});
              };
              
              // Если видео уже загружено, показываем сразу
              if (video.readyState >= 2) {
                const card = video.closest('.exercise-card');
                if (card) {
                  card.setAttribute('data-video-loaded', 'true');
                  const isCompleted = card.getAttribute('data-selected') === 'true';
                  if (isCompleted) {
                    setTimeout(() => {
                      card.setAttribute('data-show-ring', 'true');
                      card.offsetHeight; // Принудительный reflow
                    }, 100);
                  }
                }
                showVideo();
              } else {
                video.addEventListener('canplay', showVideo, { once: true });
                video.addEventListener('loadeddata', showVideo, { once: true });
              }
            }
          } else {
            const video = entry.target;
            video.pause();
          }
        });
      },
      { threshold: 0.1 }
    );
    
    // Наблюдаем за видео на видимых страницах
    setTimeout(() => {
      visiblePages.forEach((pageIndex) => {
        if (pageIndex >= 0 && pageIndex < exerciseSlides.length) {
          const pageElement = document.querySelector(`[data-page-index="${pageIndex}"]`);
          if (pageElement) {
            const videos = pageElement.querySelectorAll('video[data-src]');
            videos.forEach(video => observer.observe(video));
          }
        }
      });
    }, 50);
    
    return () => {
      observer.disconnect();
    };
  }, [currentPage, exerciseSlides.length, visiblePages]);

  // Синхронизируем data-selected и data-show-ring с состоянием workoutResults
  useEffect(() => {
    const cards = document.querySelectorAll('.exercise-card');
    cards.forEach(card => {
      const exerciseId = card.getAttribute('data-exercise-id');
      const exercise = workoutResults.exercises.find(ex => (ex.id || `exercise-${workoutResults.exercises.indexOf(ex)}`) === exerciseId);
      const isCompleted = exercise && exercise.completedSets > 0;
      
      card.setAttribute('data-selected', isCompleted ? 'true' : 'false');
      
      // Показываем ring только если видео загружено и упражнение выполнено
      if (isCompleted) {
        const videoLoaded = card.getAttribute('data-video-loaded') === 'true';
        if (videoLoaded) {
          setTimeout(() => {
            card.setAttribute('data-show-ring', 'true');
            card.offsetHeight;
          }, 50);
        } else {
          card.setAttribute('data-show-ring', 'false');
        }
      } else {
        card.setAttribute('data-show-ring', 'false');
      }
    });
  }, [workoutResults]);

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
            {/* Режим 1: список (две полосы) */}
      <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Список"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 9h16M4 15h16" />
        </svg>
      </button>
            {/* Режим 2: закрашенный квадрат (крупный вид) */}
            <button
              onClick={() => setViewMode('large')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'large'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
              title="Крупный вид"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="8" y="8" width="8" height="8" rx="2" ry="2" />
              </svg>
            </button>
            {/* Режим 3: четыре точки (4 в ряд, как 2-я иконка в конструкторе) */}
            <button
              onClick={() => setViewMode('grid-4')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'grid-4'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
              title="4 в ряд"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="7" cy="8" r="2" />
                <circle cx="17" cy="8" r="2" />
                <circle cx="7" cy="16" r="2" />
                <circle cx="17" cy="16" r="2" />
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
                              {muscleGroupTranslations[language]?.[group] || group}
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
          // Режимы grid-4 и large - простая пагинация
          <div className={viewMode === 'large' ? 'w-full' : ''}>
            <div 
              ref={swipeContainerRef}
              className="relative w-full"
              onTouchStart={handlePageSwipeStart}
              onTouchMove={handlePageSwipeMove}
              onTouchEnd={handlePageSwipeEnd}
              style={{ touchAction: 'pan-y' }}
            >
              <AnimatePresence>
                {visiblePages.map((pageIndex) => {
                  const slideExercises = exerciseSlides[pageIndex];
                  const isCurrentPage = pageIndex === currentPage;
                  
                  return (
                    <motion.div
                      key={pageIndex}
                      data-page-index={pageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isCurrentPage ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`${isCurrentPage ? 'relative block' : 'absolute inset-0 pointer-events-none'}`}
                      style={{ display: isCurrentPage ? 'block' : 'none' }}
                    >
                <div className={`gap-2 md:gap-4 transition-all duration-300 ${
                  viewMode === 'large' 
                    ? 'flex items-center justify-center w-full h-full pt-2 pb-8 overflow-visible'
                    : 'grid grid-cols-4 p-1 overflow-visible'
                }`}>
                  {slideExercises.map((exercise, exerciseIndex) => {
                    // Находим реальный индекс упражнения в общем массиве
                    const realIndex = pageIndex * viewModeConfig.exercisesPerSlide + exerciseIndex;
                    const isCompleted = exercise.completedSets > 0;
                    
                    return (
                      <div
                        key={exercise.id || realIndex}
                        onClick={() => handleToggleExercise(realIndex)}
                        className={`relative rounded-xl cursor-pointer group exercise-card ${
                          viewMode === 'large' 
                            ? 'w-full max-w-[270px] mx-auto aspect-[9/16]'
                            : 'aspect-[9/16] overflow-visible'
                        } ${
                          isCompleted ? '' : 'hover:ring-1 hover:ring-white/30'
                        }`}
                        data-exercise-id={exercise.id || realIndex}
                        data-selected={isCompleted}
                        data-show-ring="false"
                        data-video-loaded="false"
                        style={{ 
                          transition: 'padding 0.2s ease-out, box-shadow 0.2s ease-out, opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: 0,
                          borderRadius: '0.75rem'
                        }}
                      >
                        <div 
                          className={`w-full h-full rounded-xl overflow-hidden ${viewMode === 'large' ? 'relative' : ''}`}
                          style={{ 
                            transition: 'border-radius 0.2s ease-out',
                            borderRadius: '0.75rem'
                          }}
                        >
                        {/* Видео - обертка с overflow-hidden */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
                          <video
                            data-src={exercise.video}
                            poster={getPosterFromExercise(exercise)}
                            className="w-full h-full object-cover"
                            autoPlay={false}
                            muted
                            loop
                            playsInline
                            preload="none"
                            ref={(videoEl) => {
                              if (videoEl) {
                                videoRefsRef.current.set(`${pageIndex}-${exerciseIndex}`, videoEl);
                              }
                            }}
                            style={{ opacity: 0, transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
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
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            
            {/* Индикатор страниц */}
            <div className="flex items-center justify-center gap-1 mt-4 pb-4">
              {Array.from({ length: Math.min(exerciseSlides.length, 5) }, (_, i) => {
                let displayIndex;
                if (exerciseSlides.length <= 5) {
                  displayIndex = i;
                } else {
                  const start = Math.max(0, Math.min(currentPage - 2, exerciseSlides.length - 5));
                  displayIndex = start + i;
                }
                
                return (
                  <button
                    key={displayIndex}
                    onClick={() => setCurrentPage(displayIndex)}
                    className={`rounded-full transition-all duration-300 ${
                      displayIndex === currentPage
                        ? 'bg-white h-1 w-4'
                        : 'bg-white/40 h-1 w-1 hover:bg-white/60'
                    }`}
                    aria-label={`Page ${displayIndex + 1}`}
                  />
                );
              })}
            </div>
          </div>
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