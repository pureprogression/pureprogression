"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { exercises } from "@/data/exercises";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import ExercisesFilter from "./ExercisesFilter";
import "swiper/css";
import "swiper/css/pagination";

export default function WorkoutBuilder({ onSave, onCancel, isSaving = false, initialWorkout = null }) {
  const [workoutName, setWorkoutName] = useState(initialWorkout?.name || "");
  const [workoutDescription, setWorkoutDescription] = useState(initialWorkout?.description || "");
  const [selectedExercises, setSelectedExercises] = useState(initialWorkout?.exercises || []);
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState("browse"); // browse, selected
  const [clickedExercise, setClickedExercise] = useState(null); // для анимации клика
  const [draggedExercise, setDraggedExercise] = useState(null); // для drag & drop
  const [dragOverIndex, setDragOverIndex] = useState(null); // индекс для drop зоны
  const [tempOrder, setTempOrder] = useState(null); // временный порядок для визуального эффекта
  const [swipedExercise, setSwipedExercise] = useState(null); // ID упражнения в состоянии swipe
  const [swipeOffset, setSwipeOffset] = useState(0); // смещение для swipe анимации
  const [swipeOpacity, setSwipeOpacity] = useState(1); // прозрачность для fade эффекта
  const [tabSwipeStart, setTabSwipeStart] = useState(null); // начальная позиция для swipe между вкладками
  const [tabSwipeOffset, setTabSwipeOffset] = useState(0); // смещение для анимации переключения вкладок
  const [filterTransitioning, setFilterTransitioning] = useState(false);
  const [expandedBrowseId, setExpandedBrowseId] = useState(null);
  const [viewMode, setViewMode] = useState('grid-4'); // 'large', 'grid-2', 'grid-4'
  
  // Получаем уникальные категории из упражнений
  const categories = ["All", ...new Set(exercises.flatMap(ex => ex.muscleGroups))];

  // Фильтруем упражнения по категории
  const filteredExercises = exercises.filter(exercise => {
    if (selectedCategory === "All") return true;
    return exercise.muscleGroups.includes(selectedCategory);
  });
  
  // Настройки для каждого режима
  const viewModeConfig = useMemo(() => {
    switch (viewMode) {
      case 'large':
        return {
          slidesPerView: 1,
          exercisesPerSlide: 1,
          gridCols: 1
        };
      case 'grid-2':
        return {
          slidesPerView: 1,
          exercisesPerSlide: 4, // 2 ряда × 2 колонки
          gridCols: 2
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
          exercisesPerSlide: 4,
          gridCols: 2
        };
    }
  }, [viewMode]);
  
  // Разбиваем упражнения на слайды
  const exerciseSlides = useMemo(() => {
    const slides = [];
    const { exercisesPerSlide } = viewModeConfig;
    
    for (let i = 0; i < filteredExercises.length; i += exercisesPerSlide) {
      slides.push(filteredExercises.slice(i, i + exercisesPerSlide));
    }
    
    return slides;
  }, [filteredExercises, viewModeConfig]);

  // Анимация при изменении фильтра
  useEffect(() => {
    setFilterTransitioning(true);
    const timer = setTimeout(() => {
      setFilterTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  // Добавляем упражнение в тренировку
  const addExercise = useCallback((exercise) => {
    // Проверяем, не добавлено ли уже это упражнение
    setSelectedExercises(prev => {
      if (prev.some(ex => ex.id === exercise.id)) {
        return prev; // Уже добавлено, ничего не делаем
      }
      
      const exerciseWithSettings = {
        ...exercise,
        sets: 3,
        reps: 12
      };
      
      // Анимация клика
      setClickedExercise(exercise.id);
      setTimeout(() => setClickedExercise(null), 600);
      
      return [...prev, exerciseWithSettings];
    });
  }, []);

  // Удаляем упражнение из тренировки
  const removeExercise = useCallback((exerciseId) => {
    setSelectedExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  }, []);

  // Обновляем настройки упражнения
  const updateExercise = useCallback((exerciseId, field, value) => {
    setSelectedExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  }, []);

  // Перемещаем упражнение в списке
  const moveExercise = (fromIndex, toIndex) => {
    const newExercises = [...selectedExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setSelectedExercises(newExercises);
  };

  // Функции для кнопок перемещения
  const moveExerciseByOne = (exerciseId, direction) => {
    const currentIndex = selectedExercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    
    // Проверяем границы
    if (newIndex >= 0 && newIndex < selectedExercises.length) {
      moveExercise(currentIndex, newIndex);
      
      // Вибрация для обратной связи (если поддерживается)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  // Функции для swipe навигации между вкладками
  const handleTabSwipeStart = (e) => {
    const touch = e.touches[0];
    setTabSwipeStart({ x: touch.clientX, y: touch.clientY });
    setTabSwipeOffset(0);
  };

  const handleTabSwipeMove = (e) => {
    if (!tabSwipeStart) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - tabSwipeStart.x;
    const deltaY = touch.clientY - tabSwipeStart.y;
    
    // Проверяем, что движение больше по горизонтали, чем по вертикали
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      // На вкладке "browse" (Треугольник) разрешаем swipe влево для перехода на "Круг"
      // На вкладке "selected" (Круг) разрешаем swipe вправо для возврата на "Треугольник"
      if ((activeSection === "browse" && deltaX <= 0) || (activeSection === "selected" && deltaX >= 0)) {
        // Проверяем, что это не swipe-удаление упражнения
        if (activeSection === "selected" && e.target.closest('[data-exercise-card]')) {
          // Если это карточка упражнения на вкладке "selected", не обрабатываем
          // (оставляем для swipe-удаления)
          return;
        }
        
        e.preventDefault(); // Предотвращаем скролл страницы
        setTabSwipeOffset(deltaX);
      }
    }
  };

  const handleTabSwipeEnd = () => {
    if (!tabSwipeStart) return;
    
    const threshold = 80; // Минимальное расстояние для переключения
    
    if (Math.abs(tabSwipeOffset) > threshold) {
      // Swipe влево на "browse": переход к "selected"
      // Swipe вправо на "selected": переход к "browse"
      if (activeSection === "browse" && tabSwipeOffset < 0) {
        setActiveSection("selected");
        // Вибрация для обратной связи
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      } else if (activeSection === "selected" && tabSwipeOffset > 0) {
        setActiveSection("browse");
        // Вибрация для обратной связи
        if (navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
    }
    
    // Сброс состояния
    setTabSwipeStart(null);
    setTabSwipeOffset(0);
  };

  // Функции для swipe удаления
  const handleTouchStart = (e, exerciseId) => {
    const touch = e.touches[0];
    setSwipedExercise({ id: exerciseId, startX: touch.clientX });
    setSwipeOffset(0);
    setSwipeOpacity(1);
  };

  const handleTouchMove = (e, exerciseId) => {
    if (!swipedExercise || swipedExercise.id !== exerciseId) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipedExercise.startX;
    
    // Только движение влево
    if (deltaX < 0) {
      const offset = Math.max(-120, deltaX); // Ограничиваем смещение
      setSwipeOffset(offset);
      
      // Fade эффект при приближении к порогу удаления
      if (offset < -60) {
        const fadeProgress = Math.min(1, Math.abs(offset + 60) / 60); // 0-1 от -60 до -120
        const opacity = Math.max(0.3, 1 - fadeProgress * 0.7); // от 1 до 0.3
        setSwipeOpacity(opacity);
      } else {
        setSwipeOpacity(1);
      }
    }
  };

  const handleTouchEnd = (e, exerciseId) => {
    if (!swipedExercise || swipedExercise.id !== exerciseId) return;
    
    // Если смещение больше 80px, удаляем упражнение
    if (swipeOffset < -80) {
      // Вибрация для подтверждения
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      // Плавно уводим карточку влево с fade эффектом
      setSwipeOffset(-400);
      setSwipeOpacity(0);
      
      // Удаляем упражнение через 300ms, когда анимация завершится
      setTimeout(() => {
        removeExercise(exerciseId);
      }, 300);
      
      // Сбрасываем состояние после анимации
      setTimeout(() => {
        setSwipedExercise(null);
        setSwipeOpacity(1);
      }, 300);
      
      return;
    } else {
      // Возвращаем карточку в исходное положение
      setSwipeOffset(0);
      setSwipeOpacity(1);
      setSwipedExercise(null);
    }
  };

  // Drag & Drop функции
  const handleDragStart = (e, exerciseId, index) => {
    setDraggedExercise({ id: exerciseId, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    // Добавляем класс для визуального эффекта
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedExercise(null);
    setDragOverIndex(null);
    setTempOrder(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedExercise && draggedExercise.index !== index) {
      setDragOverIndex(index);
      
      // Создаем временный порядок для визуального эффекта
      const newOrder = [...selectedExercises];
      const draggedItem = newOrder[draggedExercise.index];
      
      // Удаляем перетаскиваемый элемент
      newOrder.splice(draggedExercise.index, 1);
      
      // Вставляем его в новую позицию
      newOrder.splice(index, 0, draggedItem);
      
      setTempOrder(newOrder);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setTempOrder(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedExercise && draggedExercise.index !== dropIndex) {
      moveExercise(draggedExercise.index, dropIndex);
    }
    
    setDraggedExercise(null);
    setDragOverIndex(null);
    setTempOrder(null);
  };

  // Сохраняем тренировку
  const handleSave = () => {
    if (!workoutName.trim()) {
      console.log("Введите название тренировки");
      return;
    }
    if (selectedExercises.length === 0) {
      console.log("Добавьте хотя бы одно упражнение");
      return;
    }

    const workout = {
      // Убираем id - пусть Firestore сам создаст ID
      name: workoutName,
      description: workoutDescription,
      exercises: selectedExercises,
      createdAt: new Date(),
      estimatedDuration: selectedExercises.length * 3 // Примерная оценка: 3 минуты на упражнение
    };

    onSave(workout);
  };

  return (
    <div 
      className="min-h-screen bg-black p-4 pt-4"
    >
      <div className={`max-w-7xl mx-auto ${viewMode === 'large' ? 'workout-builder-large-container overflow-x-hidden px-2' : ''}`}>
        {/* Навигация по секциям */}
        <div className="flex justify-center items-center mb-4 h-12">
          <div className="flex gap-3">
            {/* Треугольник - Выбрать упражнения */}
            <button
              onClick={() => setActiveSection("browse")}
              className={`w-8 h-8 transition-all duration-300 flex items-center justify-center ${
                activeSection === "browse" 
                  ? "scale-110" 
                  : "hover:scale-105 opacity-60 hover:opacity-100"
              }`}
              title="Выбрать упражнения"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <path d="M12 2l8 16H4l8-16z" />
              </svg>
            </button>

            {/* Круг - Моя тренировка */}
            <button
              onClick={() => setActiveSection("selected")}
              className={`w-8 h-8 transition-all duration-300 flex items-center justify-center ${
                activeSection === "selected" 
                  ? "scale-110" 
                  : "hover:scale-105 opacity-60 hover:opacity-100"
              }`}
              title="Моя тренировка"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </button>
          </div>
        </div>

        {/* Контент секций */}
        <div className="transition-all duration-500 ease-in-out">

          {/* Секция выбранных упражнений */}
          {activeSection === "selected" && (
            <div 
              className="animate-fadeIn"
            >
              <div className="p-6">
                {/* Информация о тренировке */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 transition-all duration-300 hover:bg-white/8"
                        placeholder={TEXTS[language].workoutBuilder.workoutName}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={workoutDescription}
                        onChange={(e) => setWorkoutDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 transition-all duration-300 hover:bg-white/8"
                        placeholder={TEXTS[language].workoutBuilder.workoutDescription}
                      />
                    </div>
                  </div>
                </div>

                {selectedExercises.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">{TEXTS[language].workoutBuilder.noExercisesSelected}</p>
                    <button
                      onClick={() => setActiveSection("browse")}
                      className="bg-white text-black py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
                    >
                      Select
                    </button>
                  </div>
                ) : (
                  <>

                    {/* Вертикальный список выбранных упражнений */}
                    <div className="mb-8 space-y-4">
                      {(tempOrder || selectedExercises).map((exercise, index) => {
                        // Находим реальный индекс упражнения в оригинальном массиве
                        const realIndex = selectedExercises.findIndex(ex => ex.id === exercise.id);
                        return (
                          <div 
                            key={exercise.id} 
                            data-exercise-card
                            draggable
                            onDragStart={(e) => handleDragStart(e, exercise.id, realIndex)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onTouchStart={(e) => handleTouchStart(e, exercise.id)}
                            onTouchMove={(e) => handleTouchMove(e, exercise.id)}
                            onTouchEnd={(e) => handleTouchEnd(e, exercise.id)}
                            className={`flex items-center gap-4 p-4 rounded-lg bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group relative ${
                              draggedExercise?.id === exercise.id ? 'opacity-50 scale-105' : ''
                            } ${
                              dragOverIndex === index && draggedExercise?.id !== exercise.id ? 'ring-1 ring-white/50' : ''
                            }`}
                            style={{
                              transform: swipedExercise?.id === exercise.id ? `translateX(${swipeOffset}px)` : 'translateX(0)',
                              opacity: swipedExercise?.id === exercise.id ? swipeOpacity : 1,
                              transition: swipedExercise?.id === exercise.id && Math.abs(swipeOffset) < 400 ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
                            }}
                          >
                            {/* Видео превью */}
                            <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                              <video
                                src={exercise.video}
                                poster={exercise.poster}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                              />
                            </div>

                            {/* Информация об упражнении */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm line-clamp-2 mb-3">{exercise.title}</h4>
                              
                              {/* Компактные настройки подходов и повторений */}
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-white/60">Сеты:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value))}
                                  className="w-10 px-1 py-0.5 bg-white/10 backdrop-blur-sm rounded text-white text-center text-xs focus:outline-none focus:bg-white/15 transition-all duration-300"
                                />
                                <span className="text-white/60">×</span>
                                <span className="text-white/60">Повт:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={exercise.reps}
                                  onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value))}
                                  className="w-10 px-1 py-0.5 bg-white/10 backdrop-blur-sm rounded text-white text-center text-xs focus:outline-none focus:bg-white/15 transition-all duration-300"
                                />
                              </div>
                            </div>

                              {/* Стрелки перемещения внутри карточки упражнения */}
                              {/* Верхний правый угол - переместить вверх */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveExerciseByOne(exercise.id, 'left');
                                }}
                                disabled={realIndex === 0}
                                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-white text-xs hover:opacity-70 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                                title="Переместить вверх"
                              >
                                <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-white"></div>
                              </button>

                              {/* Нижний правый угол - переместить вниз */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveExerciseByOne(exercise.id, 'right');
                                }}
                                disabled={realIndex === selectedExercises.length - 1}
                                className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center text-white text-xs hover:opacity-70 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed z-10"
                                title="Переместить вниз"
                              >
                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-white"></div>
                              </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Кнопка сохранения */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleSave}
                        disabled={!workoutName.trim() || selectedExercises.length === 0 || isSaving}
                        className="bg-white text-black py-2 px-6 rounded-lg font-medium hover:bg-gray-100 disabled:bg-white/10 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        {isSaving ? (language === "en" ? "Saving..." : "Сохранение...") : TEXTS[language].workoutBuilder.saveWorkout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Секция выбора упражнений */}
          {activeSection === "browse" && (
            <div className="animate-fadeIn">
              {/* Фильтр и переключатель режимов */}
              <div className="mb-8 flex flex-col md:flex-row gap-6 md:gap-4 items-start md:items-center">
                <div className="flex-1">
                  <ExercisesFilter 
                    exercises={exercises}
                    selectedGroup={selectedCategory}
                    setSelectedGroup={setSelectedCategory}
                    isExpanded={filterExpanded}
                    setIsExpanded={setFilterExpanded}
                  />
                </div>
                
                {/* Переключатель режимов просмотра - справа */}
                <div 
                  className="flex items-center gap-2 bg-white/5 rounded-lg p-1 self-center md:self-auto"
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchMove={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  style={{ touchAction: 'manipulation' }}
                >
                  <button
                    onClick={() => setViewMode('grid-4')}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'grid-4'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={language === 'ru' ? '4 в ряд' : '4 per row'}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid-2')}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'grid-2'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={language === 'ru' ? '2 в ряд' : '2 per row'}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('large')}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      viewMode === 'large'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={language === 'ru' ? 'Крупный вид (1 упражнение)' : 'Large view (1 exercise)'}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Слайдер упражнений с виртуализацией */}
              <div>
                {exerciseSlides.length > 0 ? (
                  <div className={viewMode === 'large' ? 'overflow-x-hidden w-full px-2 py-1' : ''}>
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
                        <div className={`gap-2 md:gap-4 transition-all duration-300 overflow-visible ${
                          viewMode === 'large' 
                            ? 'grid grid-cols-1 w-full md:max-w-md md:mx-auto p-1'
                            : viewMode === 'grid-2'
                            ? 'grid grid-cols-2 p-1'
                            : 'grid grid-cols-4 p-1'
                        }`}>
                          {slideExercises.map((exercise) => {
                      const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
                      return (
                        <motion.div
                          key={exercise.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        className={`relative rounded-xl overflow-visible cursor-pointer group ${
                          viewMode === 'large' 
                            ? 'aspect-[9/16] max-h-[80vh]'
                            : viewMode === 'grid-4'
                            ? 'aspect-[9/16]'
                            : 'aspect-[9/16]'
                        } ${
                          isSelected ? 'ring-1 ring-green-500 ring-offset-1 ring-offset-black' : 'hover:ring-1 hover:ring-white/30'
                        } ${filterTransitioning ? "filter-transitioning" : ""}`}
                        style={{ 
                          padding: isSelected ? '4px' : '0',
                          transition: 'padding 0.2s ease-out, box-shadow 0.2s ease-out',
                          willChange: isSelected ? 'padding' : 'auto'
                        }}
                          onClick={() => {
                            if (isSelected) {
                              removeExercise(exercise.id);
                            } else {
                              addExercise(exercise);
                            }
                          }}
                        >
                        <div className="w-full h-full rounded-xl overflow-hidden relative">
                        {/* Видео - обертка с overflow-hidden */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
                          <video
                            src={exercise.video}
                            poster={exercise.poster}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        </div>
                        
                        {/* Информация об упражнении - показываем только для режима 2 (grid-2) */}
                        {viewMode === 'grid-2' && (
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10 pointer-events-none" style={{ marginBottom: isSelected ? '4px' : '0' }}>
                            <h3 className="text-white font-medium text-xs mb-0 line-clamp-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                              {exercise.title}
                            </h3>
                          </div>
                        )}
                        
                        {/* Информация об упражнении для режима large */}
                        {viewMode === 'large' && (
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/60 to-transparent z-10 pointer-events-none">
                            <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">
                              {exercise.title}
                            </h3>
                            {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {exercise.muscleGroups.slice(0, 3).map((group, idx) => (
                                  <span
                                    key={idx}
                                    className="text-white/60 font-light text-xs px-2 py-0.5 rounded-full bg-transparent drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                                  >
                                    {group}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        </div>
                      </motion.div>
                    );
                  })}
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/60">
                      {language === 'ru' ? 'Упражнения не найдены' : 'No exercises found'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
