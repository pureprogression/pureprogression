"use client";

import { useState, useEffect } from "react";
import { exercises } from "@/data/exercises";
import { TEXTS } from "@/constants/texts";

export default function WorkoutBuilder({ onSave, onCancel, isSaving = false }) {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  // Получаем уникальные категории из упражнений
  const categories = ["All", ...new Set(exercises.flatMap(ex => ex.muscleGroups))];

  // Фильтруем упражнения по категории
  const filteredExercises = exercises.filter(exercise => {
    if (selectedCategory === "All") return true;
    return exercise.muscleGroups.includes(selectedCategory);
  });

  // Добавляем упражнение в тренировку
  const addExercise = (exercise) => {
    // Проверяем, не добавлено ли уже это упражнение
    if (selectedExercises.some(ex => ex.id === exercise.id)) {
      return; // Уже добавлено, ничего не делаем
    }
    
    const exerciseWithSettings = {
      ...exercise,
      sets: 3,
      reps: 12
    };
    setSelectedExercises([...selectedExercises, exerciseWithSettings]);
    
    // Анимация клика
    setClickedExercise(exercise.id);
    setTimeout(() => setClickedExercise(null), 600);
  };

  // Удаляем упражнение из тренировки
  const removeExercise = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  // Обновляем настройки упражнения
  const updateExercise = (exerciseId, field, value) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

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
      alert("Введите название тренировки");
      return;
    }
    if (selectedExercises.length === 0) {
      alert("Добавьте хотя бы одно упражнение");
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
      onTouchStart={handleTabSwipeStart}
      onTouchMove={handleTabSwipeMove}
      onTouchEnd={handleTabSwipeEnd}
    >
      <div className="max-w-7xl mx-auto">
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
              style={{
                transform: `translateX(${tabSwipeOffset}px)`,
                transition: tabSwipeStart ? 'none' : 'transform 0.3s ease-out'
              }}
              onTouchStart={handleTabSwipeStart}
              onTouchMove={handleTabSwipeMove}
              onTouchEnd={handleTabSwipeEnd}
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
                        placeholder={TEXTS.en.workoutBuilder.workoutName}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={workoutDescription}
                        onChange={(e) => setWorkoutDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm rounded-lg text-white placeholder-gray-500 focus:outline-none focus:bg-white/10 transition-all duration-300 hover:bg-white/8"
                        placeholder={TEXTS.en.workoutBuilder.workoutDescription}
                      />
                    </div>
                  </div>
                </div>

                {selectedExercises.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">{TEXTS.en.workoutBuilder.noExercisesSelected}</p>
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
                              dragOverIndex === index && draggedExercise?.id !== exercise.id ? 'ring-2 ring-white/50' : ''
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
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                              >
                                <source src={exercise.video} type="video/mp4" />
                              </video>
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
                        {isSaving ? "Saving..." : TEXTS.en.workoutBuilder.saveWorkout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Секция выбора упражнений */}
          {activeSection === "browse" && (
            <div 
              className="animate-fadeIn"
              style={{
                transform: `translateX(${tabSwipeOffset}px)`,
                transition: tabSwipeStart ? 'none' : 'transform 0.3s ease-out'
              }}
              onTouchStart={handleTabSwipeStart}
              onTouchMove={handleTabSwipeMove}
              onTouchEnd={handleTabSwipeEnd}
            >
              <div className="px-4 py-6 bg-white/5 backdrop-blur-sm rounded-xl">
                
                {/* Фильтр групп мышц */}
                <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                  {categories.map((group) => (
                    <button
                      key={group}
                      onClick={() => setSelectedCategory(group)}
                      className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 text-sm ${
                        selectedCategory === group 
                          ? "bg-white text-black" 
                          : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/15"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                {/* Сетка упражнений */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredExercises.map((exercise) => (
                    <div 
                      key={exercise.id}
                      data-exercise-card
                      className="relative rounded-lg overflow-hidden group"
                      style={{ aspectRatio: '16/18' }}
                    >
                      {/* Видео */}
                      <video 
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                      >
                        <source src={exercise.video} type="video/mp4" />
                      </video>

                      {/* Кнопка добавления/удаления */}
                      <button
                        className={`absolute bottom-3 right-3 w-8 h-8 text-white transition-all duration-300 z-50 flex items-center justify-center cursor-pointer ${
                          clickedExercise === exercise.id ? 'opacity-50' : 'opacity-100'
                        }`}
                        onClick={() => {
                          const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
                          if (isSelected) {
                            removeExercise(exercise.id);
                          } else {
                            addExercise(exercise);
                          }
                        }}
                      >
                        {selectedExercises.some(ex => ex.id === exercise.id) ? (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        )}
                      </button>

                      {/* Заголовок */}
                      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent">
                        <h3 className="text-white font-medium text-sm line-clamp-2">{exercise.title}</h3>
                      </div>

                      {/* Теги групп мышц */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex flex-wrap gap-1">
                          {exercise.muscleGroups.slice(0, 2).map((group, index) => (
                            <span 
                              key={index}
                              className="bg-white/10 backdrop-blur-sm text-white text-xs rounded px-2 py-1"
                            >
                              {group}
                            </span>
                          ))}
                          {exercise.muscleGroups.length > 2 && (
                            <span className="bg-white/10 backdrop-blur-sm text-white text-xs rounded px-2 py-1">
                              +{exercise.muscleGroups.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredExercises.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No exercises found</p>
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
