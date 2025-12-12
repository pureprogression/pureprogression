"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ru'); // RU по умолчанию
  const [isChanging, setIsChanging] = useState(false);

  // Загружаем язык из localStorage при инициализации
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ru')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Сохраняем язык в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = useCallback(() => {
    if (isChanging) return; // Предотвращаем множественные клики
    
    setIsChanging(true);
    setLanguage(prev => prev === 'en' ? 'ru' : 'en');
    
    // Сбрасываем флаг через небольшую задержку
    setTimeout(() => setIsChanging(false), 300);
  }, [isChanging]);

  // Мемоизируем контекст для оптимизации производительности
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage
  }), [language, toggleLanguage]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
