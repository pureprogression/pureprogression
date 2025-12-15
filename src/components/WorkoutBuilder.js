"use client";

import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, EffectFade } from "swiper/modules";
import { exercises } from "@/data/exercises";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import ExercisesFilter from "./ExercisesFilter";

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
    "chest": "Грудь",
    "complex": "COMPLEX"
  },
  en: {
    "back": "Back",
    "arms": "Arms",
    "abs": "Abs",
    "core": "Core",
    "legs": "Legs",
    "glutes": "Glutes",
    "shoulders": "Shoulders",
    "chest": "Chest",
    "complex": "COMPLEX"
  }
};

const WORKOUT_DRAFT_STORAGE_KEY = "workout_builder_draft_v1";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

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
  const [viewModeTransitioning, setViewModeTransitioning] = useState(false);
  const [visibleVersion, setVisibleVersion] = useState(0); // для принудительного перерендера видимости карточек
  const [expandedBrowseId, setExpandedBrowseId] = useState(null);
  const [viewMode, setViewMode] = useState('grid-4'); // 'large', 'grid-2', 'grid-4'
  const [draftRestored, setDraftRestored] = useState(false); // показывать ли уведомление о восстановленном черновике
  const shuffledExercisesRef = useRef(null); // Храним перемешанный порядок упражнений
  const lastFilteredIdsRef = useRef(''); // Отслеживаем изменение списка упражнений по ID
  const [activeSlideIndex, setActiveSlideIndex] = useState(0); // Отслеживаем активный слайд для пагинации
  const swiperRef = useRef(null); // Ref для Swiper instance
  const previousViewModeRef = useRef(viewMode); // Отслеживаем предыдущий режим
  const firstExerciseIndexRef = useRef(0); // Индекс первого упражнения текущего слайда
  const visibleCardsRef = useRef(new Map()); // карта видимости карточек

  // Восстанавливаем черновик тренировки из localStorage (только если нет initialWorkout)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialWorkout) return;

    try {
      const raw = window.localStorage.getItem(WORKOUT_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === "object") {
        if (typeof data.name === "string") {
          setWorkoutName(data.name);
        }
        if (typeof data.description === "string") {
          setWorkoutDescription(data.description);
        }
        if (Array.isArray(data.exercises) && data.exercises.length > 0) {
          setSelectedExercises(data.exercises);
          // Показываем мягкое уведомление, что черновик восстановлен
          setDraftRestored(true);
          // Автоматически скрываем подсказку через пару секунд
          setTimeout(() => setDraftRestored(false), 2500);
        }
      }
    } catch (e) {
      console.error("Failed to restore workout draft", e);
    }
  }, [initialWorkout]);

  // Сохраняем черновик тренировки в localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasData =
      workoutName.trim().length > 0 ||
      workoutDescription.trim().length > 0 ||
      selectedExercises.length > 0;

    try {
      if (!hasData) {
        window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
        return;
      }

      const draft = {
        name: workoutName,
        description: workoutDescription,
        exercises: selectedExercises,
      };
      window.localStorage.setItem(
        WORKOUT_DRAFT_STORAGE_KEY,
        JSON.stringify(draft)
      );
    } catch (e) {
      console.error("Failed to save workout draft", e);
    }
  }, [workoutName, workoutDescription, selectedExercises]);
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
  
  // Функция для перемешивания массива (Fisher-Yates shuffle)
  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Разбиваем упражнения на слайды: все упражнения перемешиваются случайным образом
  const exerciseSlides = useMemo(() => {
    const { exercisesPerSlide } = viewModeConfig;
    
    if (filteredExercises.length === 0) return [];
    
    // Проверяем, изменился ли список упражнений (по ID всех упражнений)
    const currentIds = filteredExercises.map(ex => ex.id).join(',');
    const exercisesChanged = currentIds !== lastFilteredIdsRef.current;
    
    // Если список упражнений изменился (фильтр), создаем новый перемешанный порядок
    // НО НЕ при изменении режима отображения - чтобы сохранить позицию
    if (exercisesChanged || !shuffledExercisesRef.current) {
      // Перемешиваем ВСЕ упражнения, включая те, что попадут на первый слайд
      const shuffledAll = shuffleArray([...filteredExercises]);
      
      // Сохраняем перемешанный порядок в ref
      shuffledExercisesRef.current = shuffledAll;
      lastFilteredIdsRef.current = currentIds;
    }
    
    // Используем сохраненный перемешанный порядок (не пересоздаем при смене режима!)
    const allExercises = shuffledExercisesRef.current;
    
    // Разбиваем на слайды (это пересоздается при смене режима, но порядок упражнений сохраняется)
    const slides = [];
    for (let i = 0; i < allExercises.length; i += exercisesPerSlide) {
      slides.push(allExercises.slice(i, i + exercisesPerSlide));
    }
    
    // Сохраняем текущий режим
    previousViewModeRef.current = viewMode;
    
    return slides;
  }, [filteredExercises.length, viewModeConfig.exercisesPerSlide, viewMode, shuffleArray]);
  
  // Вычисляем начальный слайд для Swiper - упрощенная версия
  const initialSlideIndex = useMemo(() => {
    if (exerciseSlides.length === 0) return 0;
    const allExercises = shuffledExercisesRef.current || filteredExercises;
    if (allExercises.length === 0 || firstExerciseIndexRef.current === 0) return 0;
    const targetExercise = allExercises[firstExerciseIndexRef.current];
    if (!targetExercise) return 0;
    const targetSlideIndex = exerciseSlides.findIndex(slide => 
      slide.some(ex => ex.id === targetExercise.id)
    );
    return targetSlideIndex !== -1 ? targetSlideIndex : 0;
  }, [exerciseSlides.length]); // Только длина, чтобы не пересоздавать постоянно

  // Синхронизация активного слайда при изменении режима - упрощенная версия
  useEffect(() => {
    if (!swiperRef.current || exerciseSlides.length === 0) return;
    
    // Используем setTimeout для отложенной синхронизации, чтобы не блокировать UI
    const timeoutId = setTimeout(() => {
      const swiper = swiperRef.current;
      if (!swiper) return;
      
      const allExercises = shuffledExercisesRef.current || filteredExercises;
      if (allExercises.length === 0) return;
      
      // Находим слайд, который содержит упражнение с индексом firstExerciseIndexRef.current
      const targetExercise = allExercises[firstExerciseIndexRef.current];
      if (!targetExercise) return;
      
      // Находим индекс слайда, который содержит это упражнение
      const targetSlideIndex = exerciseSlides.findIndex(slide => 
        slide.some(ex => ex.id === targetExercise.id)
      );
      
      if (targetSlideIndex !== -1 && targetSlideIndex !== swiper.activeIndex) {
        swiper.slideTo(targetSlideIndex, 0); // 0 = без анимации для мгновенного переключения
      }
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [viewMode, exerciseSlides.length]); // Добавили exerciseSlides.length для отслеживания изменений

  // Анимация при изменении фильтра
  useEffect(() => {
    setFilterTransitioning(true);
    const timer = setTimeout(() => {
      setFilterTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory]);


  // Инициализируем индекс первого упражнения для первого слайда
  useEffect(() => {
    if (exerciseSlides.length > 0 && exerciseSlides[0] && activeSection === 'browse') {
      const firstSlideExercises = exerciseSlides[0];
      if (firstSlideExercises.length > 0 && firstExerciseIndexRef.current === 0) {
        const allExercises = shuffledExercisesRef.current || filteredExercises;
        const firstExercise = firstSlideExercises[0];
        const firstIndex = allExercises.findIndex(ex => ex.id === firstExercise.id);
        if (firstIndex !== -1) {
          firstExerciseIndexRef.current = firstIndex;
        }
      }
    }
  }, [filteredExercises.length, activeSection]); // Минимальные зависимости

  // Обработчик изменения слайда в Swiper - оптимизированная версия
  const handleSlideChange = useCallback((swiper) => {
    const currentIndex = swiper.activeIndex;
    setActiveSlideIndex(currentIndex);
    
    if (!swiper.slides) return;
    
    // Используем requestAnimationFrame для асинхронной обработки, чтобы не блокировать UI
    requestAnimationFrame(() => {
      // АГРЕССИВНО выгружаем видео на всех неактивных слайдах (кроме текущего и следующего)
      swiper.slides.forEach((slide, index) => {
        if (index !== currentIndex && index !== currentIndex + 1) {
          const videos = slide.querySelectorAll('video');
          videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            const videoSrc = video.getAttribute('data-src') || video.src;
            video.setAttribute('data-src', videoSrc);
            video.src = '';
            video.load();
            video.style.opacity = '0';
            const card = video.closest('.exercise-card');
            if (card) {
              card.style.opacity = '0';
              card.style.pointerEvents = 'none';
            }
          });
        }
      });
      
      // Предзагружаем следующий слайд и скрываем постеры
      const nextIndex = currentIndex + 1;
      if (swiper.slides[nextIndex]) {
        const nextVideos = swiper.slides[nextIndex].querySelectorAll('video');
        nextVideos.forEach(video => {
          const dataSrc = video.getAttribute('data-src');
          if (dataSrc && !video.src) {
            video.src = dataSrc;
            video.preload = 'auto';
            video.load();
          }
          video.style.opacity = '0';
        });
      }
      
      // Загружаем и запускаем видео ТОЛЬКО на текущем слайде ПОСЛЕДОВАТЕЛЬНО
      if (swiper.slides[currentIndex]) {
        const videos = Array.from(swiper.slides[currentIndex].querySelectorAll('video'));
        
        // Сбрасываем видимость карточек текущего слайда перед показом
        videos.forEach((video) => {
          const card = video.closest('.exercise-card');
          if (card) {
            card.style.opacity = '0';
            card.style.pointerEvents = 'none';
          }
          video.style.opacity = '0';
        });
        
        // Функция для показа видео последовательно
        const showVideoSequentially = (videoIndex) => {
          if (videoIndex >= videos.length) return;
          
          const video = videos[videoIndex];
          const dataSrc = video.getAttribute('data-src');
          if (!dataSrc) {
            showVideoSequentially(videoIndex + 1);
            return;
          }
          
          // Готовим плавное появление конкретного видео
          video.style.transition = 'opacity 0.4s ease';
          video.style.opacity = '0';

          const currentSrc = video.src || '';
          if (!currentSrc || currentSrc !== dataSrc) {
            video.src = dataSrc;
          }
          video.preload = 'auto';
          video.load();
          
          const showAndContinue = () => {
            if (video.paused) {
              video.play().catch(() => {});
            }
            requestAnimationFrame(() => {
              video.style.opacity = '1';
              const card = video.closest('.exercise-card');
              if (card) {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
              }
            });

            // Показываем следующее видео сразу после появления текущего (без задержки)
            showVideoSequentially(videoIndex + 1);
          };
          
          if (video.readyState >= 2) {
            showAndContinue();
          } else {
            const onReady = () => {
              showAndContinue();
            };
            video.addEventListener('canplay', onReady, { once: true });
            video.addEventListener('loadeddata', onReady, { once: true });
            video.addEventListener('loadedmetadata', () => {
              if (video.readyState >= 2) {
                showAndContinue();
              }
            }, { once: true });
          }
        };
        
        // Начинаем последовательный показ с первого видео
        showVideoSequentially(0);
      }
      
      // Сохраняем индекс первого упражнения (асинхронно)
      setTimeout(() => {
        const currentSlide = exerciseSlides[currentIndex];
        if (currentSlide && currentSlide.length > 0) {
          const allExercises = shuffledExercisesRef.current || filteredExercises;
          const firstIndex = allExercises.findIndex(ex => ex.id === currentSlide[0].id);
          if (firstIndex !== -1) {
            firstExerciseIndexRef.current = firstIndex;
          }
        }
      }, 0);
    });
  }, [exerciseSlides.length, filteredExercises.length]);

  // После смены фильтра: вернуть на первый слайд и запустить загрузку/воспроизведение
  useEffect(() => {
    if (exerciseSlides.length === 0 || activeSection !== 'browse') return;

    const swiper = swiperRef.current;
    if (!swiper || !swiper.slides || swiper.slides.length === 0) return;

    // мгновенно перейти к первому слайду, затем применить handleSlideChange
    swiper.slideTo(0, 0);
    setActiveSlideIndex(0);
    // небольшой async, чтобы DOM успел обновиться
    requestAnimationFrame(() => {
      handleSlideChange(swiper);
    });
  }, [selectedCategory, exerciseSlides.length, activeSection, handleSlideChange]);

  // Плавный переход при смене режима просмотра — только перезапуск fade без изменения выделения
  useEffect(() => {
    const swiper = swiperRef.current;
    if (!swiper || !swiper.slides || swiper.slides.length === 0) return;
    requestAnimationFrame(() => handleSlideChange(swiper));
  }, [viewMode, handleSlideChange]);

  // При обновлении списка слайдов (после фильтрации/изменений) повторно запускаем fade-загрузку
  useEffect(() => {
    if (exerciseSlides.length === 0 || activeSection !== 'browse') return;
    const swiper = swiperRef.current;
    if (!swiper || !swiper.slides || swiper.slides.length === 0) return;
    requestAnimationFrame(() => handleSlideChange(swiper));
  }, [exerciseSlides.length, activeSection, handleSlideChange]);

  // Инициализация активного слайда при монтировании Swiper
  const handleSwiperInit = useCallback((swiper) => {
    swiperRef.current = swiper;
    setActiveSlideIndex(swiper.activeIndex);
    
    // Загружаем и запускаем видео на первом слайде
    setTimeout(() => {
      if (swiper && swiper.slides && swiper.slides.length > 0) {
        const firstSlide = swiper.slides[0];
        if (firstSlide) {
          const videos = firstSlide.querySelectorAll('video');
          videos.forEach(video => {
            const dataSrc = video.getAttribute('data-src');
            if (dataSrc) {
              video.src = dataSrc;
            }
            video.preload = 'auto';
            video.load();
            video.play().catch(() => {});
          });
          // Запускаем fade-появление так же, как при перелистывании
          requestAnimationFrame(() => handleSlideChange(swiper));
        }
      }
    }, 100);
  }, []);


  // Управляем видимостью и позицией точек пагинации - упрощенная версия
  useEffect(() => {
    if (exerciseSlides.length === 0) return;
    
    const updatePagination = () => {
      const pagination = document.querySelector('.workout-builder-swiper .swiper-pagination');
      if (!pagination) return;
      
      const bullets = Array.from(pagination.querySelectorAll('.swiper-pagination-bullet'));
      if (bullets.length === 0) return;
      
      const totalSlides = exerciseSlides.length;
      
      // Сначала скрываем все точки
      bullets.forEach((bullet) => {
        bullet.style.display = 'none';
      });
      
      // Всегда рисуем максимум 3 "слота": предыдущая, текущая, следующая
      const visibleIndices = [];
      if (activeSlideIndex > 0) visibleIndices.push(activeSlideIndex - 1);
      visibleIndices.push(activeSlideIndex);
      if (activeSlideIndex < totalSlides - 1) visibleIndices.push(activeSlideIndex + 1);
      
      visibleIndices.forEach((index) => {
        const bullet = bullets[index];
        if (bullet) {
          const offset = index - activeSlideIndex;
          const bulletWidth = 10;
          const translateX = offset * bulletWidth;
          
          bullet.style.display = 'inline-block';
          bullet.style.transform = `translateX(${translateX}px)`;
          bullet.style.opacity = index === activeSlideIndex ? '1' : '0.3';
        }
      });
    };
    
    // Используем небольшую задержку для того, чтобы DOM обновился
    const timeoutId = setTimeout(updatePagination, 50);
    return () => clearTimeout(timeoutId);
  }, [activeSlideIndex, exerciseSlides.length]);

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

  // Функции для swipe удаления (только touch / мобильные устройства)
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

  const handleTouchEnd = (_e, exerciseId) => {
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

    // После успешного сохранения очищаем черновик в localStorage
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(WORKOUT_DRAFT_STORAGE_KEY);
      } catch (e) {
        console.error("Failed to clear workout draft", e);
      }
    }

    onSave(workout);
  };

  return (
    <div 
      className="min-h-screen bg-black p-4 pt-4 relative"
    >
      {/* Мягкое уведомление о восстановленном черновике */}
      {draftRestored && (
        <div className="pointer-events-none fixed left-1/2 -translate-x-1/2 bottom-4 z-50">
          <div className="pointer-events-auto px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
            <span>{language === "ru" ? "Черновик тренировки восстановлен" : "Workout draft restored"}</span>
          </div>
        </div>
      )}

      <div className={`max-w-7xl mx-auto ${viewMode === 'large' ? 'workout-builder-large-container overflow-x-hidden' : ''}`}>
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
              className={`relative w-8 h-8 transition-all duration-300 flex items-center justify-center ${
                activeSection === "selected" 
                  ? "scale-110" 
                  : "hover:scale-105"
              }`}
              title="Моя тренировка"
            >
              <span
                className={`transition-opacity duration-300 ${
                  activeSection === "selected"
                    ? "opacity-100"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-white"
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </span>
              {selectedExercises.length > 0 && (
                <span className="absolute right-0.5 bottom-0 w-1.5 h-1.5 rounded-full bg-white"></span>
              )}
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

                            {/* Столбец действий для мобилки: вверх / вниз (без крестика) */}
                            <div className="absolute inset-y-1 right-1 flex flex-col items-center justify-between z-10 md:hidden">
                              {/* Переместить вверх */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveExerciseByOne(exercise.id, 'left');
                                }}
                                disabled={realIndex === 0}
                                className="w-6 h-6 flex items-center justify-center text-white text-xs hover:opacity-80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Переместить вверх"
                              >
                                <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-white"></div>
                              </button>

                              {/* Переместить вниз */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveExerciseByOne(exercise.id, 'right');
                                }}
                                disabled={realIndex === selectedExercises.length - 1}
                                className="w-6 h-6 flex items-center justify-center text-white text-xs hover:opacity-80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Переместить вниз"
                              >
                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-white"></div>
                              </button>
                            </div>

                            {/* Аккуратный крестик для десктопа (включая суженное окно) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeExercise(exercise.id);
                              }}
                              className="hidden md:flex absolute top-1 right-1 w-6 h-6 items-center justify-center text-white/80 hover:text-red-400 hover:scale-105 transition-all duration-200 z-10"
                              title="Удалить упражнение"
                            >
                              <span className="block w-3 h-3 relative">
                                <span className="absolute inset-0 w-full h-px bg-current rotate-45 origin-center" />
                                <span className="absolute inset-0 w-full h-px bg-current -rotate-45 origin-center" />
                              </span>
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
              <div className="mb-8 flex flex-col md:flex-row gap-6 md:gap-4 items-start md:items-center overflow-x-hidden">
                <div className="flex-1 min-w-0">
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
                  {/* Режим 1: две горизонтальные полосы (список) */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewMode('grid-4');
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                      viewMode === 'grid-4'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={language === 'ru' ? 'Список' : 'List'}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 9h16M4 15h16" />
                    </svg>
                  </button>

                  {/* Режим 2: четыре закрашенные точки */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewMode('grid-2');
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                      viewMode === 'grid-2'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={language === 'ru' ? '2 в ряд' : '2 per row'}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="7" cy="8" r="2" />
                      <circle cx="17" cy="8" r="2" />
                      <circle cx="7" cy="16" r="2" />
                      <circle cx="17" cy="16" r="2" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setViewMode('large');
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`w-10 h-10 flex items-center justify-center rounded-md text-sm font-medium transition-all ${
                      viewMode === 'large'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                    title={language === 'ru' ? 'Крупный вид (1 упражнение)' : 'Large view (1 exercise)'}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="currentColor" 
                      stroke="none" 
                      viewBox="0 0 24 24"
                    >
                      <rect x="8" y="8" width="8" height="8" rx="2" ry="2" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Слайдер упражнений с виртуализацией */}
              <div>
                {exerciseSlides.length > 0 ? (
                  <div className={`relative ${viewMode === 'large' ? 'overflow-x-hidden w-full flex items-center justify-center' : ''}`}>
                    <Swiper
                      modules={[Pagination, EffectFade]}
                      effect="fade"
                      fadeEffect={{
                        crossFade: true
                      }}
                      spaceBetween={0}
                      slidesPerView={1}
                      centeredSlides={viewMode === 'large'}
                      initialSlide={initialSlideIndex}
                      pagination={{
                        clickable: true,
                      }}
                      onSlideChange={handleSlideChange}
                      onSwiper={handleSwiperInit}
                      className={`!pb-8 w-full workout-builder-swiper ${viewMode === 'large' ? 'workout-builder-swiper-large' : ''}`}
                    >
                    {exerciseSlides.map((slideExercises, slideIndex) => {
                      const isCurrentSlide = slideIndex === activeSlideIndex;
                      const isNextSlide = slideIndex === activeSlideIndex + 1;
                      
                      return (
                      <SwiperSlide key={slideIndex} className={viewMode === 'large' ? 'workout-builder-large flex items-center justify-center' : ''}>
                        <div className={`gap-2 md:gap-4 transition-all duration-300 overflow-visible ${
                          viewMode === 'large' 
                            ? 'flex items-center justify-center w-full h-full pt-2'
                            : viewMode === 'grid-2'
                            ? 'grid grid-cols-2 p-1 workout-builder-grid-2-container'
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
                        className={`exercise-card relative rounded-xl overflow-visible cursor-pointer group ${
                          viewMode === 'large' 
                            ? 'w-full max-w-[280px] mx-auto aspect-[9/16]'
                            : viewMode === 'grid-4'
                            ? 'aspect-[9/16]'
                            : 'aspect-[9/16] w-full h-full'
                        } ${
                          isSelected
                            ? 'ring-1 ring-green-500 ring-offset-1 ring-offset-black'
                            : 'hover:ring-1 hover:ring-white/30'
                        } ${filterTransitioning ? "filter-transitioning" : ""}`}
                        data-exercise-id={exercise.id}
                        style={{ 
                          padding: isSelected ? '4px' : '0',
                          transition: 'padding 0.2s ease-out, box-shadow 0.2s ease-out, opacity 0.45s ease-out',
                          willChange: isSelected ? 'padding' : 'auto',
                          opacity: 0,
                          pointerEvents: 'none'
                        }}
                          onClick={() => {
                            if (isSelected) {
                              removeExercise(exercise.id);
                            } else {
                              addExercise(exercise);
                            }
                          }}
                        >
                        <div 
                          className="w-full h-full rounded-xl overflow-hidden relative"
                        >
                        {/* Видео - обертка с overflow-hidden */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
                          <video
                            data-src={exercise.video}
                            poster={exercise.poster}
                            className="w-full h-full object-cover"
                            style={{ 
                              opacity: 0,
                              transition: 'opacity 0.4s ease-in-out'
                            }}
                            autoPlay={false}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        </div>
                        
                        {/* Информация об упражнении */}
                        {viewMode === 'large' && (
                          <motion.div 
                            className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-6 bg-gradient-to-t from-black/85 via-black/60 to-transparent z-10 pointer-events-none flex flex-col items-center md:items-start"
                            initial={{ opacity: 0, translateY: 12 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 0.61, 0.36, 1] }}
                          >
                            <h3 className="text-white/90 text-xs md:text-sm font-medium tracking-wide mb-1.5 max-w-[90%] line-clamp-2 text-center md:text-left">
                              {exercise.title}
                            </h3>
                            {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                              <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                                {exercise.muscleGroups.slice(0, 3).map((group, idx) => (
                                  <span
                                    key={idx}
                                    className="text-white/70 font-light text-[10px] md:text-xs px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-[1px]"
                                  >
                                    {muscleGroupTranslations[language]?.[group] || group}
                                  </span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Для режима 2 в ряд – только группы мышц внизу без названия */}
                        {viewMode === 'grid-2' && exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-6 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10 pointer-events-none"
                            initial={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
                          >
                            <div className="flex flex-wrap gap-1">
                              {exercise.muscleGroups.slice(0, 3).map((group, idx) => (
                                <span
                                  key={idx}
                                  className="text-white/70 font-light text-[10px] px-1.5 py-0.5 rounded-full bg-black/40 backdrop-blur-[1px]"
                                >
                                  {muscleGroupTranslations[language]?.[group] || group}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        </div>
                      </motion.div>
                    );
                  })}
                        </div>
                      </SwiperSlide>
                      );
                    })}
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
