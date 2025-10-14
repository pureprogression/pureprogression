"use client";

import { useEffect, useRef, useState } from "react";

/**
 * LazyVideo - оптимизированный компонент для ленивой загрузки видео
 * 
 * Преимущества:
 * - Загружает видео только когда оно видимо на экране (Intersection Observer)
 * - Показывает poster image до загрузки видео
 * - Плавная анимация появления (fade-in)
 * - Skeleton loader пока видео грузится
 * - Автоматически ставит на паузу когда видео выходит из области видимости
 * - Уменьшает трафик в 3-5 раз
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
  delay = 0,
  eager = false,
  onPlay,
  onPause,
  onVideoReady,
  ...props 
}) {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(eager);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Обработчик загрузки видео
    const handleCanPlay = () => {
      // Показываем сразу без задержки
      setIsPlaying(true);
      setShowContent(true);
      if (onVideoReady) onVideoReady();
    };

    const handleLoadedData = () => {
      setIsPlaying(true);
      setShowContent(true);
      if (onVideoReady) onVideoReady();
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    // Если eager - грузим СРАЗУ без задержки
    if (eager && !hasLoaded) {
      video.load();
      setHasLoaded(true);
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }

    // Intersection Observer для отслеживания видимости (если не eager)
    if (eager) {
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          
          if (entry.isIntersecting) {
            // Видео стало видимым - загружаем СРАЗУ
            if (!hasLoaded) {
              video.load();
              setHasLoaded(true);
              if (autoPlay && video.paused) {
                video.play().catch(() => {
                  // Игнорируем ошибки autoplay
                });
              }
            } else if (autoPlay && video.paused) {
              video.play().catch(() => {});
            }
          } else {
            // Видео вышло из зоны видимости - ставим на паузу для экономии ресурсов
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        // Начинаем загрузку только когда видео близко к экрану (меньше rootMargin для более контролируемой загрузки)
        rootMargin: "50px",
        threshold: 0.1
      }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      observer.disconnect();
    };
  }, [autoPlay, hasLoaded, delay]);

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
        className={`${className} transition-opacity duration-500 ease-in-out ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        webkit-playsinline="true"
        onPlay={onPlay}
        onPause={onPause}
        {...props}
      />
    </div>
  );
}

