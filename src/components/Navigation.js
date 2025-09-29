"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function Navigation({ currentPage = "home", user = null }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      router.push('/');
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

  return (
    <>
      {/* Гамбургер кнопка */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-3 text-white hover:bg-white/10 transition-all duration-300 ease-out hover:scale-105 focus:outline-none"
        aria-label="Открыть меню"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <span className={`block h-0.5 w-5 bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
          <span className={`block h-0.5 w-5 bg-current transition-all duration-300 mt-1 ${isMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-current transition-all duration-300 mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
        </div>
      </button>

      {/* Overlay для закрытия меню */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeMenu}
        />
      )}

      {/* Боковое меню */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/20 z-50
        transform transition-transform duration-300 ease-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full p-6">
          {/* Заголовок */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Меню</h2>
            {user && (
              <p className="text-gray-400 text-sm">Добро пожаловать!</p>
            )}
          </div>

          {/* Навигационные ссылки */}
          <nav className="flex-1 space-y-6">
            {/* Основная навигация */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Навигация</h3>
              <ul className="space-y-1">
                {/* Главная */}
                {currentPage !== "home" && (
                  <li>
                    <button
                      onClick={handleHomeClick}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Главная</span>
                    </button>
                  </li>
                )}

                {/* Профиль */}
                <li>
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <div className="relative">
                      <div className="w-4 h-4 rounded-full bg-white" />
                      <div className="w-5 h-2 rounded-full bg-white transform -translate-x-0.5 -translate-y-0.5" />
                    </div>
                    <span>{user ? "Профиль" : "Войти"}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Кнопка создания новой коллекции - только для авторизованных */}
            {user && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Тренировки</h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={handleWorkoutBuilderClick}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors duration-200 text-left border border-dashed border-gray-600 hover:border-gray-400"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm">Создать тренировку</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {/* Выход - только если авторизован и не на главной */}
            {user && currentPage !== "home" && (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={handleLogoutWithClose}
                  disabled={isLoading}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{isLoading ? "Выход..." : "Выход"}</span>
                </button>
              </div>
            )}
          </nav>

          {/* Подвал */}
          <div className="pt-6 border-t border-white/10">
            <p className="text-gray-500 text-xs text-center">
              PureP Fitness
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
