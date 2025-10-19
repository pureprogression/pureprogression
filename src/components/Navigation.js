"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navigation({ currentPage = "home", user = null, disableSwipe = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const handleLogout = async () => {
    try {
      setIsLoading(true);
      // Сначала редирект, потом logout - чтобы не показывать модалку
      router.push('/');
      await signOut(auth);
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    if (user) {
      router.push('/profile');
    } else {
      router.push('/auth');
    }
    setIsMenuOpen(false);
  };

  const handleWorkoutBuilderClick = () => {
    router.push('/workout-builder');
    setIsMenuOpen(false);
  };

  const handleFavoritesClick = () => {
    router.push('/favorites');
    setIsMenuOpen(false);
  };

  const handleMyWorkoutsClick = () => {
    router.push('/my-workouts');
    setIsMenuOpen(false);
  };

  const handleWorkoutHistoryClick = () => {
    router.push('/workout-history');
    setIsMenuOpen(false);
  };

  const handleHomeClick = () => {
    router.push('/');
    setIsMenuOpen(false);
  };

  const handleLogoutWithClose = async () => {
    await handleLogout();
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Убрали свайп из-за конфликта с Safari на iPhone

  const menuContent = (
    <>
      {/* Минималистичная кнопка меню - всегда видна */}
      <motion.button
        onClick={toggleMenu}
        className="fixed top-4 left-4 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 ease-out focus:outline-none"
        aria-label="Open menu"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ zIndex: 9999 }}
      >
        <div className="w-5 h-5 flex flex-col justify-center items-center gap-1">
          <motion.span 
            className="block h-px w-4 bg-current"
            animate={{ 
              rotate: isMenuOpen ? 45 : 0,
              y: isMenuOpen ? 4 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
          <motion.span 
            className="block h-px w-4 bg-current"
            animate={{ 
              opacity: isMenuOpen ? 0 : 1,
              scale: isMenuOpen ? 0 : 1
            }}
            transition={{ duration: 0.2 }}
          />
          <motion.span 
            className="block h-px w-4 bg-current"
            animate={{ 
              rotate: isMenuOpen ? -45 : 0,
              y: isMenuOpen ? -4 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>
      </motion.button>

      {/* Overlay для закрытия меню */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          onClick={closeMenu}
        />
      )}

      {/* Боковое меню */}
      <motion.div
        className="fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/20 z-[9999]"
        initial={{ x: "-100%" }}
        animate={{ x: isMenuOpen ? 0 : "-100%" }}
        transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex flex-col h-full p-6">
          {/* Заголовок */}
          <div className="mb-8">
            {user && (
              <p className="text-gray-400 text-sm">Welcome!</p>
            )}
          </div>

          {/* Навигационные ссылки */}
          <nav className="flex-1 space-y-6">
            {/* Основная навигация */}
            <div>
              <ul className="space-y-1">
                {/* Главная */}
                {currentPage !== "home" && (
                  <li>
                    <button
                      onClick={handleHomeClick}
                      className="w-full flex items-center p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                    >
                      <span>{TEXTS[language].navigation.home}</span>
                    </button>
                  </li>
                )}

                {/* Избранное */}
                <li>
                  <button
                    onClick={handleFavoritesClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{TEXTS[language].navigation.favorites}</span>
                    <span className="text-green-500 text-xs">✓</span>
                  </button>
                </li>

                {/* Конструктор тренировок */}
                <li>
                  <button
                    onClick={handleWorkoutBuilderClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{TEXTS[language].navigation.workoutBuilder}</span>
                    {user ? (
                      <span className="text-green-500 text-xs">✓</span>
                    ) : (
                      <span className="text-gray-500 text-xs">🔒</span>
                    )}
                  </button>
                </li>

                {/* Мои тренировки */}
                <li>
                  <button
                    onClick={handleMyWorkoutsClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{TEXTS[language].navigation.myWorkouts}</span>
                    {user ? (
                      <span className="text-green-500 text-xs">✓</span>
                    ) : (
                      <span className="text-gray-500 text-xs">🔒</span>
                    )}
                  </button>
                </li>

                {/* История тренировок */}
                <li>
                  <button
                    onClick={handleWorkoutHistoryClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{TEXTS[language].navigation.workoutHistory}</span>
                    <span className="text-gray-500 text-xs">🔒</span>
                  </button>
                </li>

                {/* Профиль */}
                <li>
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{user ? TEXTS[language].navigation.profile : TEXTS[language].auth.signIn}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Выход - если пользователь авторизован */}
            {user && (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleLogoutWithClose}
                  disabled={isLoading}
                  className="w-full flex items-center p-3 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? (language === "en" ? "Signing out..." : "Выход...") : TEXTS[language].navigation.logout}</span>
                </button>
              </div>
            )}

            {/* Переключатель языков */}
            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setIsLanguageChanging(true);
                  toggleLanguage();
                  setTimeout(() => setIsLanguageChanging(false), 300);
                }}
                disabled={isLanguageChanging}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium">
                  {language === 'en' ? 'ENG' : 'RU'}
                </span>
              </button>
            </div>

            {/* Подвал */}
            <div className="pt-6 border-t border-white/10">
              <p className="text-gray-500 text-xs text-center">
                Beta Version
              </p>
            </div>
          </nav>
        </div>
      </motion.div>
    </>
  );

  // Рендерим Navigation через Portal в document.body
  if (!mounted) return null;
  return createPortal(menuContent, document.body);
}
