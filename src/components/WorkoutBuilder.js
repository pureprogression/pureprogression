"use client";

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { exercises, getExerciseTitle } from "@/data/exercises";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import ExercisesFilter from "./ExercisesFilter";

// Упрощенный компонент для видео превью на вкладке круга
// Загружает все видео сразу, но паузит невидимые для экономии ресурсов
const LazyVideoPreview = memo(({ src, poster, exerciseId }) => {
  const videoRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Загружаем видео сразу при монтировании
    if (!video.src) {
      video.src = src;
      video.preload = 'metadata';
      video.load();
    }

    // Запускаем воспроизведение после загрузки
    const handleCanPlay = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };
    const handleLoadedData = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.addEventListener('loadeddata', handleLoadedData, { once: true });

    // IntersectionObserver только для паузы невидимых видео
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const currentVideo = videoRef.current;
          if (!currentVideo) return;

          if (entry.isIntersecting) {
            // Видео видно - воспроизводим
            if (currentVideo.paused && currentVideo.readyState >= 2) {
              currentVideo.play().catch(() => {});
            }
          } else {
            // Видео не видно - паузим
            if (!currentVideo.paused) {
              currentVideo.pause();
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observer.observe(video);
    observerRef.current = observer;

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      const currentVideo = videoRef.current;
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.src = '';
        currentVideo.load();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      className="w-full h-full object-cover"
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
});

LazyVideoPreview.displayName = 'LazyVideoPreview';

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
  const [pageReloadToken, setPageReloadToken] = useState(0); // триггер для безопасной повторной инициализации текущей страницы
  const [isPageLoading, setIsPageLoading] = useState(false); // индикатор загрузки текущей страницы
  const shuffledExercisesRef = useRef(null); // Храним перемешанный порядок упражнений
  const lastFilteredIdsRef = useRef(''); // Отслеживаем изменение списка упражнений по ID
  const [currentPage, setCurrentPage] = useState(0); // Текущая страница (вместо activeSlideIndex)
  const previousViewModeRef = useRef(null); // Отслеживаем предыдущий режим (null при первой загрузке)
  const videoRefsRef = useRef(new Map()); // Ref для видео элементов: exerciseId -> videoElement
  const swipeStartRef = useRef(null); // Начальная позиция свайпа
  const swipeContainerRef = useRef(null); // Ref для контейнера страниц
  const viewModeChangingRef = useRef(false); // Флаг изменения режима
  const viewModeChangeTimeoutRef = useRef(null); // Таймер для debounce переключения режима
  const currentExerciseIndexRef = useRef(0); // Индекс первого упражнения на текущей странице (для сохранения позиции при смене режима)
  const currentExerciseIdRef = useRef(null); // ID первого упражнения на текущей странице (для более надежного сохранения позиции)
  const exerciseSlidesRef = useRef([]); // Ref для актуальных exerciseSlides
  const currentPageRef = useRef(0); // Ref для актуального currentPage
  const timeoutRefsRef = useRef(new Set()); // Ref для хранения всех активных таймеров для очистки
  const observerRef = useRef(null); // Ref для Intersection Observer

  // Общая очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      // Очищаем все таймеры
      timeoutRefsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefsRef.current.clear();
      
      // Очищаем Observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      
      // Очищаем таймер переключения режима
      if (viewModeChangeTimeoutRef.current) {
        clearTimeout(viewModeChangeTimeoutRef.current);
        viewModeChangeTimeoutRef.current = null;
      }
      
      // Останавливаем все видео
      videoRefsRef.current.forEach((video) => {
        if (video && !video.paused) {
          video.pause();
        }
      });
      videoRefsRef.current.clear();
    };
  }, []);

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
    
    return slides;
  }, [filteredExercises.length, viewModeConfig.exercisesPerSlide, viewMode, shuffleArray]);

  // Обновляем refs для актуальных значений
  useEffect(() => {
    exerciseSlidesRef.current = exerciseSlides;
  }, [exerciseSlides]);
  
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Сохраняем индекс и ID первого упражнения на текущей странице при изменении страницы
  useEffect(() => {
    if (exerciseSlides.length === 0) return;
    if (currentPage >= exerciseSlides.length) return;
    
    const currentSlide = exerciseSlides[currentPage];
    if (currentSlide && currentSlide.length > 0) {
      const allExercises = shuffledExercisesRef.current || [];
      const firstExerciseId = currentSlide[0].id;
      const exerciseIndex = allExercises.findIndex(ex => ex.id === firstExerciseId);
      if (exerciseIndex !== -1) {
        currentExerciseIndexRef.current = exerciseIndex;
        currentExerciseIdRef.current = firstExerciseId;
      }
    }
  }, [currentPage, exerciseSlides]);

  // Восстанавливаем позицию при изменении режима - работает для всех переходов (1->2, 2->3, 3->2, 2->1 и т.д.)
  useLayoutEffect(() => {
    if (exerciseSlides.length === 0) return;
    
    const previousMode = previousViewModeRef.current;
    const currentMode = viewMode;
    
    // Если режим действительно изменился (не первая загрузка)
    if (previousMode !== null && previousMode !== currentMode) {
      // Используем сохраненный ID упражнения (более надежно, чем индекс)
      const targetExerciseId = currentExerciseIdRef.current;
      
      if (targetExerciseId) {
        // Ищем страницу, которая содержит это упражнение
        let foundPage = -1;
        for (let i = 0; i < exerciseSlides.length; i++) {
          if (exerciseSlides[i].some(ex => ex.id === targetExerciseId)) {
            foundPage = i;
            break;
          }
        }
        
        if (foundPage !== -1) {
          // Нашли страницу с этим упражнением - устанавливаем её
          setCurrentPage(foundPage);
          // Обновляем previousViewModeRef после установки страницы
          previousViewModeRef.current = currentMode;
          return;
        }
      }
      
      // Если не нашли по ID, пробуем по индексу (fallback)
      const allExercises = shuffledExercisesRef.current || [];
      const targetExerciseIndex = currentExerciseIndexRef.current;
      
      if (targetExerciseIndex >= 0 && targetExerciseIndex < allExercises.length) {
        const fallbackExerciseId = allExercises[targetExerciseIndex].id;
        
        let foundPage = -1;
        for (let i = 0; i < exerciseSlides.length; i++) {
          if (exerciseSlides[i].some(ex => ex.id === fallbackExerciseId)) {
            foundPage = i;
            break;
          }
        }
        
        if (foundPage !== -1) {
          setCurrentPage(foundPage);
          previousViewModeRef.current = currentMode;
          return;
        }
      }
    }
    
    // Обновляем previousViewModeRef в конце (включая первую загрузку)
    previousViewModeRef.current = currentMode;
    
    // Корректируем currentPage если он выходит за границы
    if (currentPage >= exerciseSlides.length) {
      setCurrentPage(Math.max(0, exerciseSlides.length - 1));
    }
  }, [viewMode, exerciseSlides]); // Срабатывает при изменении режима или exerciseSlides

  // Анимация при изменении фильтра
  useEffect(() => {
    setFilterTransitioning(true);
    const timer = setTimeout(() => {
      setFilterTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  // Сбрасываем страницу при изменении фильтра
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedCategory]);

  // Определяем видимые страницы (текущая + соседние ±1)
  const visiblePages = useMemo(() => {
    if (exerciseSlides.length === 0) return [];
    const pages = [];
    const startPage = Math.max(0, currentPage - 1);
    const endPage = Math.min(exerciseSlides.length - 1, currentPage + 1);
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, exerciseSlides.length]);

  // Загружаем текущую страницу сразу + Observer для соседних страниц
  useEffect(() => {
    if (exerciseSlides.length === 0 || activeSection !== 'browse') {
      setIsPageLoading(false);
      return;
    }
    
    // Показываем индикатор загрузки сразу при переходе на новую страницу
    setIsPageLoading(true);
    
    // Очищаем предыдущий Observer если есть
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    
    // Загружаем видео текущей страницы СРАЗУ
    let retryCount = 0;
    const MAX_RETRIES = 20; // Максимум 20 попыток (1 секунда)
    let loadedCount = 0; // Счетчик загруженных видео
    let totalVideos = 0; // Общее количество видео на странице
    
    const loadCurrentPage = () => {
      try {
        const currentPageElement = document.querySelector(`[data-page-index="${currentPage}"]`);
        if (!currentPageElement) {
          retryCount++;
          if (retryCount < MAX_RETRIES) {
            const timeoutId = setTimeout(loadCurrentPage, 50);
            timeoutRefsRef.current.add(timeoutId);
          } else {
            // Если не удалось найти элемент, скрываем индикатор
            setIsPageLoading(false);
          }
          return;
        }
        
        const videos = currentPageElement.querySelectorAll('video[data-src]');
        totalVideos = videos.length;
        
        // Если на странице нет видео, скрываем индикатор
        if (totalVideos === 0) {
          setIsPageLoading(false);
          return;
        }

        videos.forEach((video) => {
          const dataSrc = video.getAttribute('data-src');
          
          // Проверяем, если видео уже было загружено ранее (при возврате на вкладку browse)
          if (video.src && video.readyState >= 2) {
            // Видео уже загружено, показываем его сразу
            loadedCount++;
            video.style.opacity = '1';
            const card = video.closest('.exercise-card');
            if (card) {
              card.style.opacity = '1';
              card.style.pointerEvents = 'auto';
              card.setAttribute('data-video-loaded', 'true');
              
              // Как только первое видео появилось — убираем индикатор
              if (loadedCount === 1) {
                setIsPageLoading(false);
              }

            const isSelected = card.getAttribute('data-selected') === 'true';
            if (isSelected) {
              const timeoutId = setTimeout(() => {
                card.setAttribute('data-show-ring', 'true');
                card.offsetHeight;
                timeoutRefsRef.current.delete(timeoutId);
              }, 50);
              timeoutRefsRef.current.add(timeoutId);
            }
            
            const timeoutId2 = setTimeout(() => {
              const infoElements = card.querySelectorAll('[data-exercise-info]');
              infoElements.forEach(el => {
                el.style.opacity = '1';
                el.style.transition = 'opacity 0.3s ease-out';
              });
              timeoutRefsRef.current.delete(timeoutId2);
            }, 50);
            timeoutRefsRef.current.add(timeoutId2);
          }
          video.play().catch(() => {});
        } else if (dataSrc && !video.src) {
          // Видео еще не загружено, загружаем его
          video.src = dataSrc;
          video.preload = 'auto';
          video.load();
          
          const showVideo = () => {
            loadedCount++;
            video.style.opacity = '1';
            const card = video.closest('.exercise-card');
            if (card) {
              // Показываем карточку вместе с видео
              card.style.opacity = '1';
              card.style.pointerEvents = 'auto';
              
              // Сохраняем флаг что видео загружено
              card.setAttribute('data-video-loaded', 'true');

              // Как только первое видео появилось — убираем индикатор
              if (loadedCount === 1) {
                setIsPageLoading(false);
              }
              
              // Показываем выделение только после загрузки видео, если упражнение выбрано
              const isSelected = card.getAttribute('data-selected') === 'true';
              if (isSelected) {
                // Небольшая задержка для плавного появления выделения после видео
                const timeoutId = setTimeout(() => {
                  card.setAttribute('data-show-ring', 'true');
                  timeoutRefsRef.current.delete(timeoutId);
                }, 100);
                timeoutRefsRef.current.add(timeoutId);
              }
              
              // Показываем информацию об упражнении (группы мышц, названия) с небольшой задержкой
              const timeoutId2 = setTimeout(() => {
                const infoElements = card.querySelectorAll('[data-exercise-info]');
                infoElements.forEach(el => {
                  el.style.opacity = '1';
                  el.style.transition = 'opacity 0.3s ease-out';
                });
                timeoutRefsRef.current.delete(timeoutId2);
              }, 100);
              timeoutRefsRef.current.add(timeoutId2);
            }
            video.play().catch(() => {});
          };
          
          if (video.readyState >= 2) {
            showVideo();
          } else {
            video.addEventListener('canplay', showVideo, { once: true });
            video.addEventListener('loadeddata', showVideo, { once: true });
          }
        }
      });
      } catch (error) {
        console.error('Error loading current page videos:', error);
        setIsPageLoading(false);
      }
    };
    
    loadCurrentPage();
    
    // Intersection Observer для предзагрузки соседних страниц (текущая ±1)
    let observer;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          try {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const video = entry.target;
                if (!video) return;
                const dataSrc = video.getAttribute('data-src');
                if (dataSrc && !video.src) {
                  video.src = dataSrc;
                  video.preload = 'auto';
                  video.load(); // Только предзагружаем, не показываем
                }
              }
            });
          } catch (error) {
            console.error('Error in IntersectionObserver callback:', error);
          }
        },
        { rootMargin: '200px' }
      );
    } catch (error) {
      console.error('Error creating IntersectionObserver:', error);
      observer = null;
    }
    
    observerRef.current = observer;

    // Подключаем Observer только к соседним страницам (текущая ±1)
    const observerTimeoutId = setTimeout(() => {
      try {
        const prevPageIndex = currentPage - 1;
        const nextPageIndex = currentPage + 1;
        
        [prevPageIndex, nextPageIndex].forEach(pageIndex => {
          if (pageIndex >= 0 && pageIndex < exerciseSlides.length) {
            const pageElement = document.querySelector(`[data-page-index="${pageIndex}"]`);
            if (pageElement && observer) {
              const videos = pageElement.querySelectorAll('video[data-src]');
              videos.forEach(video => {
                try {
                  observer.observe(video);
                } catch (error) {
                  console.error('Error observing video:', error);
                }
              });
            }
          }
        });
      } catch (error) {
        console.error('Error setting up IntersectionObserver:', error);
      } finally {
        timeoutRefsRef.current.delete(observerTimeoutId);
      }
    }, 50);
    timeoutRefsRef.current.add(observerTimeoutId);
    
    // Агрессивная очистка видео на страницах дальше чем ±1
    const cleanupTimeoutId = setTimeout(() => {
      try {
        const allPages = document.querySelectorAll('[data-page-index]');
        allPages.forEach((pageElement) => {
          const pageIndex = parseInt(pageElement.getAttribute('data-page-index'));
          // Очищаем видео на страницах дальше чем ±1 от текущей
          if (Math.abs(pageIndex - currentPage) > 1) {
            const videos = pageElement.querySelectorAll('video');
            videos.forEach((video) => {
              try {
                video.pause();
                video.currentTime = 0;
                video.src = '';
                video.load();
                const card = video.closest('[data-exercise-id]');
                if (card) {
                  const exerciseId = card.getAttribute('data-exercise-id');
                  if (exerciseId) {
                    videoRefsRef.current.delete(exerciseId);
                  }
                  card.setAttribute('data-video-loaded', 'false');
                }
              } catch (error) {
                // Игнорируем ошибки
              }
            });
          }
        });
      } catch (error) {
        console.error('Error in cleanup:', error);
      } finally {
        timeoutRefsRef.current.delete(cleanupTimeoutId);
      }
    }, 5000); // Через 5 секунд после загрузки текущей страницы - даем время видео загрузиться
    timeoutRefsRef.current.add(cleanupTimeoutId);

    return () => {
      // Очищаем все таймеры
      timeoutRefsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      timeoutRefsRef.current.clear();
      
      // Отключаем Observer и очищаем все наблюдаемые элементы
      if (observerRef.current) {
        try {
          // Отключаем все наблюдения перед disconnect
          const allVideos = document.querySelectorAll('video[data-src]');
          allVideos.forEach(video => {
            try {
              observerRef.current.unobserve(video);
            } catch (error) {
              // Игнорируем ошибки если элемент уже удален
            }
          });
          observerRef.current.disconnect();
        } catch (error) {
          console.error('Error disconnecting observer:', error);
        }
        observerRef.current = null;
      }
      
      // НЕ очищаем видео здесь - это может очистить видео до их загрузки
      // Очистка происходит в периодическом cleanup и при переключении страниц
    };
  }, [currentPage, exerciseSlides.length, activeSection, pageReloadToken]);

  // Watchdog: если по какой-то причине видео на текущей странице не инициализировались,
  // пробуем мягко переинициализировать загрузку
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (exerciseSlides.length === 0 || activeSection !== 'browse') return;

    const timeoutId = window.setTimeout(() => {
      const currentPageElement = document.querySelector(`[data-page-index="${currentPage}"]`);
      if (!currentPageElement) return;

      const videos = currentPageElement.querySelectorAll('video');
      const loadedCards = currentPageElement.querySelectorAll('.exercise-card[data-video-loaded="true"]');

      // Если на странице есть видео, но ни одно не помечено как загруженное,
      // считаем, что что-то пошло не так и мягко триггерим повторную инициализацию
      if (videos.length > 0 && loadedCards.length === 0) {
        setPageReloadToken((prev) => prev + 1);
      }
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [currentPage, activeSection, exerciseSlides.length]);

  // Функция агрессивной очистки памяти
  const performMemoryCleanup = useCallback(() => {
    try {
      // Очищаем видео на страницах дальше чем ±1
      const allPages = document.querySelectorAll('[data-page-index]');
      allPages.forEach((pageElement) => {
        const pageIndex = parseInt(pageElement.getAttribute('data-page-index'));
        // Очищаем видео на страницах дальше чем ±1 от текущей
        if (Math.abs(pageIndex - currentPage) > 1) {
          const videos = pageElement.querySelectorAll('video');
          videos.forEach((video) => {
            try {
              video.pause();
              video.currentTime = 0;
              video.src = '';
              video.load();
              const card = video.closest('[data-exercise-id]');
              if (card) {
                const exerciseId = card.getAttribute('data-exercise-id');
                if (exerciseId) {
                  videoRefsRef.current.delete(exerciseId);
                }
                card.setAttribute('data-video-loaded', 'false');
              }
            } catch (error) {
              // Игнорируем ошибки
            }
          });
        }
      });
      
      // Очищаем videoRefsRef от несуществующих видео
      const visiblePageIndices = new Set([currentPage - 1, currentPage, currentPage + 1]);
      const visibleVideos = new Set();
      
      visiblePageIndices.forEach(pageIndex => {
        if (pageIndex >= 0 && pageIndex < exerciseSlides.length) {
          const pageElement = document.querySelector(`[data-page-index="${pageIndex}"]`);
          if (pageElement) {
            pageElement.querySelectorAll('video').forEach(video => {
              const exerciseId = video.closest('[data-exercise-id]')?.getAttribute('data-exercise-id');
              if (exerciseId) {
                visibleVideos.add(exerciseId);
              }
            });
          }
        }
      });
      
      // Удаляем из videoRefsRef видео, которых нет на видимых страницах
      videoRefsRef.current.forEach((video, exerciseId) => {
        if (!visibleVideos.has(exerciseId)) {
          try {
            if (video) {
              video.pause();
              video.src = '';
              video.load();
            }
            videoRefsRef.current.delete(exerciseId);
          } catch (error) {
            // Игнорируем ошибки
          }
        }
      });
    } catch (error) {
      console.error('Error in memory cleanup:', error);
    }
  }, [currentPage, exerciseSlides.length]);

  // Периодическая очистка памяти каждые 30 секунд для предотвращения накопления
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeSection !== 'browse') return;

    const cleanupInterval = setInterval(() => {
      performMemoryCleanup();
    }, 30000); // Каждые 30 секунд

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [activeSection, performMemoryCleanup]);

  // Очистка при переключении страниц
  useEffect(() => {
    if (activeSection !== 'browse') return;
    
    // Запускаем очистку через 3 секунды после переключения страницы
    const cleanupTimeout = setTimeout(() => {
      performMemoryCleanup();
    }, 3000);
    
    return () => {
      clearTimeout(cleanupTimeout);
    };
  }, [currentPage, activeSection, performMemoryCleanup]);

  // При возврате вкладки из фона или восстановлении страницы из bfcache
  // аккуратно пробуем переинициализировать текущую страницу
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityOrShow = () => {
      if (document.visibilityState === 'visible') {
        // Только для вкладки с браузингом упражнений
        if (activeSection === 'browse' && exerciseSlides.length > 0) {
          setPageReloadToken((prev) => prev + 1);
        }
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrShow);
    window.addEventListener('pageshow', handleVisibilityOrShow);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityOrShow);
      window.removeEventListener('pageshow', handleVisibilityOrShow);
    };
  }, [activeSection, exerciseSlides.length]);

  // Убеждаемся что информация остается видимой при выделении карточки и переключении режима
  useEffect(() => {
    // Используем requestAnimationFrame для оптимизации DOM операций
    const rafId = requestAnimationFrame(() => {
      // Проверяем все карточки с загруженным видео и показываем информацию
      const cards = document.querySelectorAll('.exercise-card[data-video-loaded="true"]');
      cards.forEach(card => {
        const infoElements = card.querySelectorAll('[data-exercise-info]');
        infoElements.forEach(el => {
          if (el.style.opacity !== '1') {
            el.style.opacity = '1';
            el.style.transition = 'opacity 0.3s ease-out';
          }
        });
      });
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [selectedExercises, currentPage, viewMode]);

  // Синхронизируем data-selected и data-show-ring с состоянием selectedExercises
  useEffect(() => {
    // Используем requestAnimationFrame для оптимизации DOM операций
    const rafId = requestAnimationFrame(() => {
      const cards = document.querySelectorAll('.exercise-card');
      cards.forEach(card => {
        const exerciseId = card.getAttribute('data-exercise-id');
        const isSelected = selectedExercises.some(ex => ex.id === exerciseId);
        card.setAttribute('data-selected', isSelected ? 'true' : 'false');
        
        // Показываем ring только если видео загружено и упражнение выбрано
        if (isSelected) {
          const videoLoaded = card.getAttribute('data-video-loaded') === 'true';
          if (videoLoaded) {
            const timeoutId = setTimeout(() => {
              card.setAttribute('data-show-ring', 'true');
              card.offsetHeight;
              timeoutRefsRef.current.delete(timeoutId);
            }, 50);
            timeoutRefsRef.current.add(timeoutId);
          } else {
            card.setAttribute('data-show-ring', 'false');
          }
        } else {
          card.setAttribute('data-show-ring', 'false');
        }
      });
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [selectedExercises]);

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

  // Обработчики свайпа/drag для навигации между страницами (тач + мышь)
  const handlePageSwipeStart = useCallback((e) => {
    // Поддержка тач и мыши
    if ('touches' in e) {
      swipeStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    } else if ('button' in e) {
      // Только левая кнопка мыши
      if (e.button !== 0) return;
      swipeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
      };
    }
  }, []);

  const handlePageSwipeMove = useCallback((e) => {
    if (!swipeStartRef.current) return;
    // Для тача блокируем вертикальный скролл, когда уже начали горизонтальный жест
    if ('touches' in e) {
      e.preventDefault();
    }
  }, []);

  const handlePageSwipeEnd = useCallback((e) => {
    if (!swipeStartRef.current) return;

    let endX = 0;
    let endY = 0;

    if ('changedTouches' in e) {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
    } else {
      endX = e.clientX;
      endY = e.clientY;
    }

    const deltaX = endX - swipeStartRef.current.x;
    const deltaY = endY - swipeStartRef.current.y;
    const deltaTime = Date.now() - swipeStartRef.current.time;
    
    // Проверяем что это горизонтальный свайп/drag (не вертикальный скролл)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50 && deltaTime < 400) {
      if (deltaX > 0) {
        // Свайп/drag вправо - предыдущая страница
        goToPrevPage();
      } else {
        // Свайп/drag влево - следующая страница
        goToNextPage();
      }
    }
    
    swipeStartRef.current = null;
  }, [goToNextPage, goToPrevPage]);




  // Функция для безопасного переключения режима с debounce
  const handleViewModeChange = useCallback((newMode) => {
    if (newMode === viewMode) return;
    
    // Сохраняем текущую позицию СИНХРОННО перед переключением режима (используем актуальные значения из refs)
    const currentSlides = exerciseSlidesRef.current;
    const currentPageIndex = currentPageRef.current;
    
    if (currentSlides.length > 0 && currentPageIndex < currentSlides.length) {
      const currentSlide = currentSlides[currentPageIndex];
      if (currentSlide && currentSlide.length > 0) {
        const allExercises = shuffledExercisesRef.current || [];
        const firstExerciseId = currentSlide[0].id;
        const exerciseIndex = allExercises.findIndex(ex => ex.id === firstExerciseId);
        if (exerciseIndex !== -1) {
          currentExerciseIndexRef.current = exerciseIndex;
          currentExerciseIdRef.current = firstExerciseId;
        }
      }
    }
    
    if (viewModeChangeTimeoutRef.current) {
      clearTimeout(viewModeChangeTimeoutRef.current);
    }
    
    if (viewModeChangingRef.current) return;
    
    setViewMode(newMode);
    
    // Очищаем предыдущий таймер если есть
    if (viewModeChangeTimeoutRef.current) {
      clearTimeout(viewModeChangeTimeoutRef.current);
    }
    
    viewModeChangingRef.current = true;
    viewModeChangeTimeoutRef.current = setTimeout(() => {
      viewModeChangingRef.current = false;
      viewModeChangeTimeoutRef.current = null;
    }, 300);
  }, [viewMode]);

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
      const timeoutId = setTimeout(() => {
        setClickedExercise(null);
        timeoutRefsRef.current.delete(timeoutId);
      }, 600);
      timeoutRefsRef.current.add(timeoutId);
      
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
      const timeoutId1 = setTimeout(() => {
        removeExercise(exerciseId);
        timeoutRefsRef.current.delete(timeoutId1);
      }, 300);
      timeoutRefsRef.current.add(timeoutId1);
      
      // Сбрасываем состояние после анимации
      const timeoutId2 = setTimeout(() => {
        setSwipedExercise(null);
        setSwipeOpacity(1);
        timeoutRefsRef.current.delete(timeoutId2);
      }, 300);
      timeoutRefsRef.current.add(timeoutId2);
      
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
                            {/* Видео превью с ленивой загрузкой */}
                            <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                              <LazyVideoPreview
                                src={exercise.video}
                                poster={exercise.poster}
                                exerciseId={exercise.id}
                              />
                            </div>

                            {/* Информация об упражнении */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm line-clamp-2 mb-3">{getExerciseTitle(exercise, language)}</h4>
                              
                              {/* Компактные настройки подходов и повторений */}
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-white/60">Сеты:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min="1"
                                  max="20"
                                  value={exercise.sets}
                                  onFocus={(e) => {
                                    e.target.select();
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 20)) {
                                      updateExercise(exercise.id, 'sets', value === '' ? 1 : parseInt(value) || 1);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    if (value < 1) {
                                      updateExercise(exercise.id, 'sets', 1);
                                    } else if (value > 20) {
                                      updateExercise(exercise.id, 'sets', 20);
                                    }
                                  }}
                                  className="w-8 h-6 px-1 py-0 bg-white/10 backdrop-blur-sm rounded text-white text-center text-xs focus:outline-none focus:bg-white/15 transition-all duration-300"
                                  style={{ fontSize: '16px' }}
                                />
                                <span className="text-white/60">×</span>
                                <span className="text-white/60">Повт:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min="1"
                                  max="100"
                                  value={exercise.reps}
                                  onFocus={(e) => {
                                    e.target.select();
                                  }}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 100)) {
                                      updateExercise(exercise.id, 'reps', value === '' ? 1 : parseInt(value) || 1);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    if (value < 1) {
                                      updateExercise(exercise.id, 'reps', 1);
                                    } else if (value > 100) {
                                      updateExercise(exercise.id, 'reps', 100);
                                    }
                                  }}
                                  className="w-8 h-6 px-1 py-0 bg-white/10 backdrop-blur-sm rounded text-white text-center text-xs focus:outline-none focus:bg-white/15 transition-all duration-300"
                                  style={{ fontSize: '16px' }}
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

          {/* Индикатор загрузки текущей страницы упражнений (browse) */}
          {activeSection === "browse" && isPageLoading && (
            <div 
              className="pointer-events-none fixed z-30 flex items-center justify-center"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                position: 'fixed'
              }}
            >
              <div className="w-9 h-9 rounded-full border border-white/35 animate-pulse shadow-[0_0_25px_rgba(255,255,255,0.25)]" />
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
                      handleViewModeChange('grid-4');
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
                      handleViewModeChange('grid-2');
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
                      handleViewModeChange('large');
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

              {/* Простая пагинация вместо Swiper */}
              <div>
                {exerciseSlides.length > 0 ? (
                  <div className={`relative ${viewMode === 'large' ? 'overflow-x-hidden w-full flex items-center justify-center overflow-y-visible' : ''}`}>
                    {/* Контейнер для страниц */}
                    <div 
                      ref={swipeContainerRef}
                      className={`relative w-full ${viewMode === 'large' ? 'overflow-visible' : ''}`}
                      onTouchStart={handlePageSwipeStart}
                      onTouchMove={handlePageSwipeMove}
                      onTouchEnd={handlePageSwipeEnd}
                      onMouseDown={handlePageSwipeStart}
                      onMouseMove={handlePageSwipeMove}
                      onMouseUp={handlePageSwipeEnd}
                      onMouseLeave={handlePageSwipeEnd}
                      style={{ touchAction: 'pan-y' }} // Для тача разрешаем только вертикальный скролл
                    >
                      <AnimatePresence>
                        {visiblePages.map((pageIndex) => {
                          const slideExercises = exerciseSlides[pageIndex];
                          const isCurrentPage = pageIndex === currentPage;
                          
                          // Проверяем что slideExercises существует
                          if (!slideExercises || !Array.isArray(slideExercises)) {
                            return null;
                          }
                          
                          return (
                            <motion.div
                              key={pageIndex}
                              data-page-index={pageIndex}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: isCurrentPage ? 1 : 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`${isCurrentPage ? 'relative block' : 'absolute inset-0 pointer-events-none'} ${viewMode === 'large' ? 'overflow-visible' : ''}`}
                              style={{ display: isCurrentPage ? 'block' : 'none' }}
                            >
                              <div className={`gap-2 md:gap-4 transition-all duration-300 ${
                          viewMode === 'large' 
                                  ? 'flex items-center justify-center w-full h-full pt-2'
                            : viewMode === 'grid-2'
                                  ? 'grid grid-cols-2 p-1 workout-builder-grid-2-container pb-6 overflow-visible'
                                  : 'grid grid-cols-4 p-1 overflow-visible'
                        }`}>
                          {slideExercises.map((exercise) => {
                      const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
                      return (
                        <motion.div
                          key={exercise.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        className={`exercise-card relative rounded-xl overflow-hidden cursor-pointer group ${
                          viewMode === 'large' 
                            ? 'w-full max-w-[250px] mx-auto aspect-[9/16]'
                            : viewMode === 'grid-4'
                            ? 'aspect-[9/16]'
                            : 'aspect-[9/16] w-full h-full'
                        } ${filterTransitioning ? "filter-transitioning" : ""} ${
                          isSelected ? '' : 'hover:ring-1 hover:ring-white/30'
                        }`}
                        data-exercise-id={exercise.id}
                        data-selected={isSelected}
                        data-show-ring="false"
                        data-video-loaded="false"
                        style={{ 
                          transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.2s ease-out',
                          opacity: 0, // Скрываем карточку до появления видео
                          borderRadius: '0.75rem' // Явно задаем border-radius для плавного перехода
                        }}
                          onClick={() => {
                            if (isSelected) {
                              removeExercise(exercise.id);
                              // Скрываем ring при снятии выделения
                              const card = document.querySelector(`[data-exercise-id="${exercise.id}"]`);
                              if (card) {
                                card.setAttribute('data-show-ring', 'false');
                                card.setAttribute('data-selected', 'false');
                              }
                            } else {
                              addExercise(exercise);
                              // Показываем ring только если видео загружено
                              const card = document.querySelector(`[data-exercise-id="${exercise.id}"]`);
                              if (card) {
                                card.setAttribute('data-selected', 'true');
                                const videoLoaded = card.getAttribute('data-video-loaded') === 'true';
                                if (videoLoaded) {
                                  const timeoutId = setTimeout(() => {
                                    card.setAttribute('data-show-ring', 'true');
                                    card.offsetHeight;
                                    timeoutRefsRef.current.delete(timeoutId);
                                  }, 50);
                                  timeoutRefsRef.current.add(timeoutId);
                                }
                              }
                            }
                          }}
                        >
                        <div 
                          className="w-full h-full rounded-xl overflow-hidden relative"
                          style={{ 
                            transition: 'border-radius 0.2s ease-out',
                            borderRadius: '0.75rem'
                          }}
                        >
                        {/* Элемент выделения */}
                        <div className="exercise-selection-ring"></div>
                        {/* Видео - обертка с overflow-hidden */}
                        <div className="absolute inset-0 rounded-xl overflow-hidden z-0">
                          <video
                            key={`video-${exercise.id}`}
                            data-src={exercise.video}
                            className="w-full h-full object-cover"
                            style={{ 
                              opacity: 0,
                              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            autoPlay={false}
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            ref={(videoEl) => {
                              if (videoEl) {
                                videoRefsRef.current.set(exercise.id, videoEl);
                              }
                            }}
                          />
                        </div>
                        
                        {/* Информация об упражнении */}
                        {viewMode === 'large' && (
                          <div 
                            data-exercise-info
                            className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-6 bg-gradient-to-t from-black/85 via-black/60 to-transparent z-10 pointer-events-none flex flex-col items-center md:items-start"
                            style={{ opacity: 0, transition: 'opacity 0.3s ease-out' }} // Скрываем до появления видео
                          >
                            <h3 className="text-white/90 text-xs md:text-sm font-medium tracking-wide mb-1.5 max-w-[90%] line-clamp-2 text-center md:text-left">
                              {getExerciseTitle(exercise, language)}
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
                          </div>
                        )}

                        {/* Для режима 2 в ряд – только группы мышц внизу без названия */}
                        {viewMode === 'grid-2' && exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                          <div
                            data-exercise-info
                            className="absolute bottom-0 left-0 right-0 px-1.5 pb-1.5 pt-4 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-10 pointer-events-none"
                            style={{ opacity: 0, transition: 'opacity 0.3s ease-out' }} // Скрываем до появления видео
                          >
                            <div className="flex flex-wrap gap-1">
                              {exercise.muscleGroups.slice(0, 3).map((group, idx) => (
                                <span
                                  key={idx}
                                  className="text-white/70 font-light text-[8px] px-1 py-0.5 rounded-full bg-black/40 backdrop-blur-[1px]"
                                >
                                  {muscleGroupTranslations[language]?.[group] || group}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        </div>
                      </motion.div>
                    );
                  })}
                        </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      
                      {/* Индикатор страниц */}
                      <div className={`flex items-center justify-center gap-1 ${viewMode === 'large' ? 'mt-4 pb-4' : 'mt-6 pb-6'}`}>
                        {Array.from({ length: Math.min(exerciseSlides.length, 5) }, (_, i) => {
                          // Показываем максимум 5 точек, центрируя вокруг текущей страницы
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
