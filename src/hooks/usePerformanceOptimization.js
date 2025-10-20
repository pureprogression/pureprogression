"use client";

import { useEffect, useRef } from 'react';

export const usePerformanceOptimization = () => {
  const isLowEndDevice = useRef(false);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    // Определяем слабые устройства
    const checkDevicePerformance = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        isLowEndDevice.current = true;
        return;
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // Проверяем на слабые GPU
        if (renderer.includes('Intel') || renderer.includes('Mali') || renderer.includes('Adreno 4')) {
          isLowEndDevice.current = true;
        }
      }

      // Проверяем память
      if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
        isLowEndDevice.current = true;
      }

      // Проверяем количество ядер
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
        isLowEndDevice.current = true;
      }
    };

    // Проверяем настройки пользователя
    const checkUserPreferences = () => {
      isReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    };

    checkDevicePerformance();
    checkUserPreferences();

    // Ограничиваем количество одновременных анимаций на слабых устройствах
    if (isLowEndDevice.current) {
      document.body.classList.add('low-performance');
    }

    // Применяем настройки для уменьшенной анимации
    if (isReducedMotion.current) {
      document.body.classList.add('reduced-motion');
    }
  }, []);

  return {
    isLowEndDevice: isLowEndDevice.current,
    isReducedMotion: isReducedMotion.current
  };
};

// Хук для оптимизации видео
export const useVideoOptimization = () => {
  useEffect(() => {
    // Ограничиваем количество одновременных видео на мобильных
    const videoElements = document.querySelectorAll('video');
    let activeVideos = 0;
    const maxActiveVideos = window.innerWidth < 768 ? 1 : 2;

    const handleVideoPlay = (e) => {
      if (activeVideos >= maxActiveVideos) {
        e.target.pause();
        return;
      }
      activeVideos++;
    };

    const handleVideoPause = () => {
      activeVideos = Math.max(0, activeVideos - 1);
    };

    videoElements.forEach(video => {
      video.addEventListener('play', handleVideoPlay);
      video.addEventListener('pause', handleVideoPause);
      video.addEventListener('ended', handleVideoPause);
    });

    return () => {
      videoElements.forEach(video => {
        video.removeEventListener('play', handleVideoPlay);
        video.removeEventListener('pause', handleVideoPause);
        video.removeEventListener('ended', handleVideoPause);
      });
    };
  }, []);
};

// Хук для предотвращения утечек памяти
export const useMemoryOptimization = () => {
  useEffect(() => {
    // Очистка таймеров при размонтировании
    const timers = new Set();
    
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    window.setTimeout = (...args) => {
      const id = originalSetTimeout(...args);
      timers.add(id);
      return id;
    };
    
    window.setInterval = (...args) => {
      const id = originalSetInterval(...args);
      timers.add(id);
      return id;
    };

    return () => {
      timers.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
      });
    };
  }, []);
};
