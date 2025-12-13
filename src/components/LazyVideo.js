"use client";

import { useEffect, useRef, useState } from "react";

/**
 * LazyVideo - оптимизированный компонент для ленивой загрузки видео
 * 
 * Преимущества:
 * - Загружает видео только когда оно видимо на экране (Intersection Observer)
 * - Показывает poster image до загрузки видео
 * - Плавная анимация появления (fade-in)
 * - Автоматически ставит на паузу когда видео выходит из области видимости
 */
export default function LazyVideo({ 
  src, 
  poster, 
  autoPlay = true, 
  muted = true, 
  loop = true, 
  playsInline = true,
  className = "",
  preload = "none",
  onPlay,
  onPause,
  onVideoReady,
  rootMargin = "500px", // Можно настроить для разных контекстов
  disablePause = false, // Отключить автоматическую паузу (полезно для Swiper)
  ...props 
}) {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Функция проверки видимости через getBoundingClientRect
    const checkVisibility = () => {
      const rect = video.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight + 500 && rect.bottom > -500 && rect.width > 0 && rect.height > 0;
      return isInViewport;
    };

    // Проверяем видимость сразу при монтировании и загружаем если видно
    const initialCheck = () => {
      if (checkVisibility()) {
        setIsVisible(true);
        if (!hasLoaded) {
          video.load();
          setHasLoaded(true);
          setTimeout(() => {
            if (autoPlay && video && video.paused) {
              video.play().catch(() => {});
            }
          }, 200);
        }
      }
    };
    
    // Проверяем сразу и с задержками
    initialCheck();
    setTimeout(initialCheck, 100);
    setTimeout(initialCheck, 500);
    setTimeout(initialCheck, 1000);

    const handleCanPlay = () => {
      setIsPlaying(true);
      setShowContent(true);
      if (onVideoReady) onVideoReady();
    };

    const handleLoadedData = () => {
      setIsPlaying(true);
      setShowContent(true);
      if (onVideoReady) onVideoReady();
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    // Intersection Observer для отслеживания видимости
    // Используем более агрессивные настройки для работы внутри Swiper
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Дополнительная проверка через getBoundingClientRect для надежности
          const rect = video.getBoundingClientRect();
          const isActuallyVisible = rect.top < window.innerHeight + 500 && rect.bottom > -500 && rect.width > 0 && rect.height > 0;
          
          if (entry.isIntersecting || isActuallyVisible) {
            setIsVisible(true);
            
            // Видео стало видимым - загружаем СРАЗУ
            if (!hasLoaded) {
              video.load();
              setHasLoaded(true);
              // Небольшая задержка перед воспроизведением для стабильности
              setTimeout(() => {
                if (autoPlay && video && video.paused) {
                  video.play().catch(() => {
                    // Игнорируем ошибки autoplay
                  });
                }
              }, 100);
            } else if (autoPlay && video.paused) {
              // Если уже загружено, воспроизводим сразу
              video.play().catch(() => {});
            }
          } else {
            // Видео вышло из зоны видимости - ставим на паузу для экономии ресурсов
            // НО только если видео действительно не видно И пауза не отключена
            if (!disablePause && !isActuallyVisible && !video.paused && hasLoaded) {
              // Увеличенная задержка перед паузой для Swiper, чтобы избежать случайных пауз
              setTimeout(() => {
                if (video && !video.paused && !checkVisibility()) {
                  // Дополнительная проверка - не ставим на паузу, если видео в активном слайде Swiper
                  const parentSlide = video.closest('.swiper-slide');
                  if (parentSlide && parentSlide.classList.contains('swiper-slide-active')) {
                    // Не ставим на паузу, если это активный слайд
                    return;
                  }
                  video.pause();
                }
              }, 2000); // Увеличили задержку с 500ms до 2000ms для Swiper
            }
          }
        });
      },
      {
        // Более агрессивная предзагрузка для лучшего UX и работы внутри Swiper
        rootMargin: rootMargin, // Используем переданный rootMargin или дефолтный 500px
        threshold: 0.01      // Загружаем даже при минимальной видимости
      }
    );

    // Небольшая задержка перед подключением observer, чтобы избежать проблем при обновлении страницы
    const observerTimer = setTimeout(() => {
      if (video) {
        observer.observe(video);
      }
    }, 100);

    // Периодическая проверка видимости для надежности (особенно для Swiper)
    const visibilityCheckInterval = setInterval(() => {
      if (checkVisibility() && !hasLoaded) {
        video.load();
        setHasLoaded(true);
        setTimeout(() => {
          if (autoPlay && video && video.paused) {
            video.play().catch(() => {});
          }
        }, 200);
      } else if (checkVisibility() && hasLoaded && autoPlay && video.paused) {
        video.play().catch(() => {});
      }
    }, 1000);

    return () => {
      if (observerTimer) clearTimeout(observerTimer);
      if (visibilityCheckInterval) clearInterval(visibilityCheckInterval);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [autoPlay, hasLoaded, rootMargin]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {/* Poster image - базовый слой, всегда видим */}
      {poster && (
        <img
          src={poster}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      )}
      
      {/* Минималистичный пульсирующий индикатор - только если нет poster */}
      {!imageLoaded && !showContent && (
        <div className="absolute inset-0 bg-black z-10 flex items-center justify-center">
          <div 
            className="w-2.5 h-2.5 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              animation: 'breathe 2s ease-in-out infinite'
            }}
          ></div>
        </div>
      )}
      
      {/* Видео - быстрое плавное появление поверх poster */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        className={`${className} transition-opacity duration-400 ease-in-out ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          zIndex: isPlaying ? 2 : 1
        }}
        webkit-playsinline="true"
        onPlay={() => {
          setIsPlaying(true);
          if (onPlay) onPlay();
        }}
        onPause={() => {
          setIsPlaying(false);
          if (onPause) onPause();
        }}
        {...props}
      />
    </div>
  );
}
