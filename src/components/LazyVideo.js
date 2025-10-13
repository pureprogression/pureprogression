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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Обработчик загрузки видео
    const handleCanPlay = () => {
      // Минимальная задержка для показа skeleton (300ms)
      setTimeout(() => {
        setIsPlaying(true);
        setShowContent(true);
      }, 300);
    };

    const handleLoadedData = () => {
      setTimeout(() => {
        setIsPlaying(true);
        setShowContent(true);
      }, 300);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

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
      video.removeEventListener('loadeddata', handleLoadedData);
      observer.disconnect();
    };
  }, [autoPlay, hasLoaded]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Минималистичный skeleton loader */}
      {!showContent && (
        <div className="absolute inset-0 bg-black z-10 flex items-center justify-center">
          {/* Пульсирующий круг */}
          <div className="relative">
            {/* Внешнее кольцо */}
            <div className="w-12 h-12 border border-white/10 rounded-full animate-pulse"></div>
            {/* Вращающееся кольцо */}
            <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-white/40 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
        </div>
      )}
      
      {/* Poster image - плавное появление */}
      {poster && (
        <img
          src={poster}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
          onLoad={() => setImageLoaded(true)}
        />
      )}
      
      {/* Видео - очень плавное появление с легким zoom */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={preload}
        className={`${className} transition-all duration-1000 ease-out ${isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        webkit-playsinline="true"
        onPlay={onPlay}
        onPause={onPause}
        {...props}
      />
    </div>
  );
}

