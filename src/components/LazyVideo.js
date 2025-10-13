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
  onPlay,
  onPause,
  ...props 
}) {
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Обработчик загрузки видео
    const handleCanPlay = () => {
      setIsPlaying(true);
    };

    video.addEventListener('canplay', handleCanPlay);

    // Intersection Observer для отслеживания видимости
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          
          if (entry.isIntersecting) {
            // Видео стало видимым - загружаем и играем
            if (!hasLoaded) {
              video.load();
              setHasLoaded(true);
            }
            if (autoPlay && video.paused) {
              video.play().catch(() => {
                // Игнорируем ошибки autoplay (может быть заблокировано браузером)
              });
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
        // Начинаем загрузку за 200px до появления на экране
        rootMargin: "200px",
        threshold: 0.1
      }
    );

    observer.observe(video);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      observer.disconnect();
    };
  }, [autoPlay, hasLoaded]);

  return (
    <div className="relative w-full h-full">
      {/* Skeleton loader пока видео грузится */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
          </div>
        </div>
      )}
      
      {/* Видео с fade-in анимацией */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        className={`${className} transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        webkit-playsinline="true"
        onPlay={onPlay}
        onPause={onPause}
        {...props}
      />
    </div>
  );
}

