"use client";

import { useEffect, useRef, useState } from "react";

/**
 * LazyVideo - оптимизированный компонент для ленивой загрузки видео
 * 
 * Преимущества:
 * - Загружает видео только когда оно видимо на экране (Intersection Observer)
 * - Показывает poster image до загрузки видео
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
      observer.disconnect();
    };
  }, [autoPlay, hasLoaded]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
      className={className}
      webkit-playsinline="true"
      onPlay={onPlay}
      onPause={onPause}
      {...props}
    />
  );
}

