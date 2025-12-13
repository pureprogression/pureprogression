"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { exercises } from "@/data/exercises";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import LazyVideo from "./LazyVideo";
import ExercisesFilter from "./ExercisesFilter";

/**
 * WorkoutBuilderV2 - Улучшенная версия конструктора
 * Split-screen дизайн: слева библиотека, справа выбранные упражнения
 */
export default function WorkoutBuilderV2({ onSave, onCancel, isSaving = false }) {
  const [workoutName, setWorkoutName] = useState("");
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedExercise, setDraggedExercise] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);

  // Получаем уникальные категории
  const categories = ["All", ...new Set(exercises.flatMap(ex => ex.muscleGroups))];

  // Фильтруем упражнения
  const filteredExercises = exercises.filter(exercise => {
    const matchesCategory = selectedCategory === "All" || exercise.muscleGroups.includes(selectedCategory);
    const matchesSearch = searchQuery === "" || 
      exercise.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Добавляем упражнение
  const addExercise = (exercise) => {
    if (selectedExercises.some(ex => ex.id === exercise.id)) return;
    
    const exerciseWithSettings = {
      ...exercise,
      sets: 3,
      reps: 12,
      rest: 60 // секунды отдыха
    };
    setSelectedExercises([...selectedExercises, exerciseWithSettings]);
  };

  // Удаляем упражнение
  const removeExercise = (exerciseId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.id !== exerciseId));
  };

  // Обновляем настройки упражнения
  const updateExercise = (exerciseId, field, value) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.id === exerciseId ? { ...ex, [field]: value } : ex
    ));
  };

  // Перемещаем упражнение
  const moveExercise = (fromIndex, toIndex) => {
    const newExercises = [...selectedExercises];
    const [movedExercise] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, movedExercise);
    setSelectedExercises(newExercises);
  };

  // Вычисляем примерное время тренировки
  const estimatedDuration = selectedExercises.reduce((total, ex) => {
    // Предполагаем: 30 сек на подход + время отдыха
    const timePerSet = 30;
    const restTime = ex.rest || 60;
    return total + (ex.sets * timePerSet) + ((ex.sets - 1) * restTime);
  }, 0);

  const minutes = Math.ceil(estimatedDuration / 60);

  // Сохраняем тренировку
  const handleSave = () => {
    if (!workoutName.trim()) {
      alert(language === 'ru' ? 'Введите название тренировки' : 'Enter workout name');
      return;
    }
    if (selectedExercises.length === 0) {
      alert(language === 'ru' ? 'Добавьте хотя бы одно упражнение' : 'Add at least one exercise');
      return;
    }

    onSave({
      name: workoutName,
      description: workoutDescription,
      exercises: selectedExercises,
      estimatedDuration: minutes
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <input
              type="text"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder={language === 'ru' ? 'Название тренировки' : 'Workout name'}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !workoutName.trim() || selectedExercises.length === 0}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving 
                ? (language === 'ru' ? 'Сохранение...' : 'Saving...')
                : (language === 'ru' ? 'Сохранить' : 'Save')
              }
            </button>
          </div>
        </div>
        {selectedExercises.length > 0 && (
          <div className="max-w-7xl mx-auto mt-2 text-sm text-white/60">
            {language === 'ru' 
              ? `~${minutes} мин • ${selectedExercises.length} упражнений`
              : `~${minutes} min • ${selectedExercises.length} exercises`
            }
          </div>
        )}
      </div>

      {/* Split Screen Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Exercise Library */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-light mb-4">
                {language === 'ru' ? 'Библиотека упражнений' : 'Exercise Library'}
              </h2>
              
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ru' ? 'Поиск упражнений...' : 'Search exercises...'}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 mb-4 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
              />

              {/* Filter */}
              <ExercisesFilter
                exercises={exercises}
                selectedGroup={selectedCategory}
                setSelectedGroup={setSelectedCategory}
              />
            </div>

            {/* Exercise Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              <AnimatePresence>
                {filteredExercises.map((exercise) => {
                  const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
                  return (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => !isSelected && addExercise(exercise)}
                      className={`relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer ${
                        isSelected 
                          ? 'opacity-50 cursor-not-allowed ring-2 ring-green-500' 
                          : 'hover:ring-2 hover:ring-white/30'
                      }`}
                    >
                      <LazyVideo
                        videoSrc={exercise.video}
                        posterSrc={exercise.poster}
                        title={exercise.title}
                        isFavorite={false}
                        onToggleFavorite={() => {}}
                        readOnly={true}
                        showInfo={true}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <div className="bg-green-500 rounded-full p-2">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Selected Exercises */}
          <div className="space-y-4">
            <h2 className="text-xl font-light">
              {language === 'ru' ? 'Выбранные упражнения' : 'Selected Exercises'}
              <span className="ml-2 text-white/40">({selectedExercises.length})</span>
            </h2>

            {selectedExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/40 mb-4">
                  {language === 'ru' 
                    ? 'Выберите упражнения слева'
                    : 'Select exercises from the left'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                <AnimatePresence>
                  {selectedExercises.map((exercise, index) => (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Exercise Preview */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <LazyVideo
                            videoSrc={exercise.video}
                            posterSrc={exercise.poster}
                            title={exercise.title}
                            isFavorite={false}
                            onToggleFavorite={() => {}}
                            readOnly={true}
                            showInfo={false}
                          />
                        </div>

                        {/* Exercise Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium mb-3 truncate">{exercise.title}</h3>
                          
                          {/* Sets/Reps Controls */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-white/60 mb-1 block">
                                {language === 'ru' ? 'Подходы' : 'Sets'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={exercise.sets}
                                onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-white/30"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-white/60 mb-1 block">
                                {language === 'ru' ? 'Повторения' : 'Reps'}
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 1)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-white/30"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-white/60 mb-1 block">
                                {language === 'ru' ? 'Отдых (сек)' : 'Rest (sec)'}
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="300"
                                value={exercise.rest || 60}
                                onChange={(e) => updateExercise(exercise.id, 'rest', parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:border-white/30"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => removeExercise(exercise.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {index > 0 && (
                            <button
                              onClick={() => moveExercise(index, index - 1)}
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                          )}
                          {index < selectedExercises.length - 1 && (
                            <button
                              onClick={() => moveExercise(index, index + 1)}
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

