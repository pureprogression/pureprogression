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

  const handleFavoritesClick = () => {
    router.push('/favorites');
    setIsMenuOpen(false);
  };

  const handleMyWorkoutsClick = () => {
    router.push('/my-workouts');
    setIsMenuOpen(false);
  };

  const handleWorkoutHistoryClick = () => {
    console.log("🔍 Переход на страницу истории тренировок");
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

                {/* Избранное */}
                <li>
                  <button
                    onClick={handleFavoritesClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>Избранное</span>
                    </div>
                    <span className="text-green-500 text-xs">✓</span>
                  </button>
                </li>

                {/* Конструктор тренировок */}
                <li>
                  <button
                    onClick={handleWorkoutBuilderClick}
                    className="w-full flex items-center justify-between p-3 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span>Конструктор</span>
                    </div>
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
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Мои тренировки</span>
                    </div>
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
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>История тренировок</span>
                    </div>
                    <span className="text-gray-500 text-xs">🔒</span>
                  </button>
                </li>

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
