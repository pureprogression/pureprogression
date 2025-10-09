"use client";

import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // ENG по умолчанию

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

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ru' : 'en');
  };

  // Мемоизируем контекст для оптимизации производительности
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage
  }), [language]);

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
