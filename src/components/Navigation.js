"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { auth, isAdmin } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import DonationModal from "./DonationModal";
import ReviewsModal from "./ReviewsModal";
import PremiumModal from "./PremiumModal";
import { useSubscription } from "@/hooks/useSubscription";

export default function Navigation({ currentPage = "home", user = null, disableSwipe = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const [isLanguageChanging, setIsLanguageChanging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { hasSubscription } = useSubscription();

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

  const handleMyWorkoutsClick = () => {
    if (!user) {
      router.push('/auth');
      setIsMenuOpen(false);
      return;
    }
    // Админы имеют доступ без подписки
    if (!hasSubscription && !isAdmin(user)) {
      router.push('/subscribe');
      setIsMenuOpen(false);
      return;
    }
    router.push('/my-workouts');
    setIsMenuOpen(false);
  };

  const handlePremiumClick = () => {
    if (!user) {
      router.push('/auth?redirect=/profile');
      setIsMenuOpen(false);
      return;
    }
    // Всегда ведем на страницу профиля
    router.push('/profile');
    setIsMenuOpen(false);
  };

  const handleArticlesClick = () => {
    router.push('/articles');
    setIsMenuOpen(false);
  };

  const handleWorkoutHistoryClick = () => {
    router.push('/workout-history');
    setIsMenuOpen(false);
  };

  const handleWeeklyPlanClick = () => {
    if (user) {
      router.push('/weekly-plan');
    } else {
      router.push('/auth');
    }
    setIsMenuOpen(false);
  };

  const handleTrainingProgramClick = () => {
    if (user) {
      router.push('/training-program');
    } else {
      router.push('/auth');
    }
    setIsMenuOpen(false);
  };

  const handleAdminPanelClick = () => {
    router.push('/admin/weekly-plans');
    setIsMenuOpen(false);
  };

  const handleAdminSubscriptionsClick = () => {
    router.push('/admin/subscriptions');
    setIsMenuOpen(false);
  };

  const handleRequestPlanClick = () => {
    if (user) {
      router.push('/request-plan');
    } else {
      router.push('/auth');
    }
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
          className="fixed inset-0 bg-transparent backdrop-blur-md z-[9998]"
          onClick={closeMenu}
        />
      )}

      {/* Боковое меню */}
      <motion.div
        className="fixed top-3 left-3 h-[85vh] w-[300px] bg-white/3 backdrop-blur-3xl border border-white/5 rounded-2xl z-[9999] shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
        initial={{ x: "-120%", opacity: 0 }}
        animate={{ x: isMenuOpen ? 0 : "-120%", opacity: isMenuOpen ? 1 : 0 }}
        transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex flex-col h-full p-4">
          {/* Заголовок */}
          <div className="mb-6">
            {user && (
              <p className="text-gray-400 text-sm">Welcome!</p>
            )}
          </div>

          {/* Навигационные ссылки */}
          <nav className="flex-1 space-y-3">
            {/* Основная навигация */}
            <div>
              <ul className="space-y-2">
                {/* Главная */}
                {currentPage !== "home" && (
                  <li>
                    <button
                      onClick={handleHomeClick}
                      className="w-full flex items-center p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                    >
                      <span>{TEXTS[language].navigation.home}</span>
                    </button>
                  </li>
                )}

                {/* Premium */}
                <li>
                  <button
                    onClick={handlePremiumClick}
                    className="w-full flex items-center p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left border border-green-500/50 hover:border-green-500"
                  >
                    <span className="flex items-center gap-2">
                      <span>⭐</span>
                      <span>{language === 'en' ? 'Premium' : 'Premium'}</span>
                    </span>
                  </button>
                </li>

                {/* Статьи */}
                <li>
                  <button
                    onClick={handleArticlesClick}
                    className="w-full flex items-center p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{TEXTS[language].navigation.articles}</span>
                  </button>
                </li>

                {/* My Workouts - для всех пользователей */}
                {user && (
                  <li>
                    <button
                      onClick={handleMyWorkoutsClick}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg transition-colors duration-200 text-left ${
                        hasSubscription || isAdmin(user)
                          ? 'text-white hover:bg-white/10'
                          : 'text-white/70 hover:bg-white/10 cursor-pointer'
                      }`}
                    >
                      <span>{TEXTS[language].navigation.myWorkouts}</span>
                      {hasSubscription || isAdmin(user) ? (
                        <span className="text-green-500 text-xs">✓</span>
                      ) : (
                        <span className="text-yellow-500 text-xs">🔒</span>
                      )}
                    </button>
                  </li>
                )}

                {/* Недельный план - временно скрыто, будет добавлено позже */}
                {/* {user && (
                  <>
                    <li>
                      <button
                        onClick={handleRequestPlanClick}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                      >
                        <span>{language === 'ru' ? 'Запрос плана' : 'Request Plan'}</span>
                        <span className="text-yellow-500 text-xs">📝</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleWeeklyPlanClick}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                      >
                        <span>{TEXTS[language].navigation.weeklyPlan}</span>
                        <span className="text-yellow-500 text-xs">📅</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleTrainingProgramClick}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                      >
                        <span>{TEXTS[language].navigation.trainingProgram}</span>
                        <span className="text-yellow-500 text-xs">💪</span>
                      </button>
                    </li>
                  </>
                )} */}

                {/* Админ-панель */}
                {user && isAdmin(user) && (
                  <>
                    <li className="my-2">
                      <div className="h-px bg-white/20 mx-3"></div>
                    </li>
                    <li>
                      <button
                        onClick={handleAdminPanelClick}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left border border-yellow-500/30"
                      >
                        <span>{TEXTS[language].navigation.adminPanel}</span>
                        <span className="text-yellow-500 text-xs">⚙️</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleAdminSubscriptionsClick}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left border border-yellow-500/30"
                      >
                        <span>{TEXTS[language].navigation.subscriptions}</span>
                        <span className="text-yellow-500 text-xs">💳</span>
                      </button>
                    </li>
                  </>
                )}

                {/* Разделитель */}
                <li className="my-2">
                  <div className="h-px bg-white/20 mx-3"></div>
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

                {/* Донаты */}
                <li>
                  <button
                    onClick={() => {
                      setIsDonationModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{language === 'en' ? 'Support Project' : 'Поддержать проект'}</span>
                    <span className="text-yellow-500 text-xs">💝</span>
                  </button>
                </li>

                {/* Отзывы */}
                <li>
                  <button
                    onClick={() => {
                      setIsReviewsModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 text-left"
                  >
                    <span>{language === 'en' ? 'Leave Review' : 'Оставить отзыв'}</span>
                    <span className="text-blue-500 text-xs">⭐</span>
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
                Pure.Progression
              </p>
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Модалка донатов */}
      <DonationModal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
      />

      {/* Модалка отзывов */}
      <ReviewsModal 
        isOpen={isReviewsModalOpen} 
        onClose={() => setIsReviewsModalOpen(false)} 
      />

      {/* Модалка подписки */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
          setShowPremiumModal(false);
          router.push('/subscribe');
        }}
        feature={language === 'en' ? 'this feature' : 'этой функции'}
        requiresAuth={false}
      />
    </>
  );

  // Рендерим Navigation через Portal в document.body
  if (!mounted) return null;
  return createPortal(menuContent, document.body);
}
