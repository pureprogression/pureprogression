"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { auth, isAdmin } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import ReviewsModal from "./ReviewsModal";

const INSTAGRAM_URL =
  "https://www.instagram.com/pureprogression_?igsh=MXV4c3B3dDhxYW1vNg%3D%3D&utm_source=qr";
const TELEGRAM_URL = "https://t.me/pureprogression";

export default function Navigation({ currentPage = "home", user = null, disableSwipe = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();
  const { hasSubscription, isLoading: subscriptionLoading } = useSubscription();
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

  const handleMyWorkoutsClick = () => {
    if (!user) {
      router.push('/auth');
      setIsMenuOpen(false);
      return;
    }
    router.push('/my-workouts');
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

  const handleSubscribeClick = () => {
    router.push("/subscribe");
    setIsMenuOpen(false);
  };

  const handleArticlesClick = () => {
    router.push("/articles");
    setIsMenuOpen(false);
  };

  const handleTelegramChatClick = () => {
    window.open(TELEGRAM_URL, "_blank", "noopener,noreferrer");
    setIsMenuOpen(false);
  };

  const showSubscribeCta =
    user &&
    !subscriptionLoading &&
    !hasSubscription &&
    !isAdmin(user) &&
    currentPage !== "subscribe";

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
      {/* Кнопка меню - стрелка вниз/вверх в правом верхнем углу */}
      <motion.button
        onClick={toggleMenu}
        className="fixed top-4 right-4 w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-all duration-300 ease-out focus:outline-none z-[10000]"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="currentColor"
          animate={{ rotate: isMenuOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <path d="M6 8L0 0h12L6 8z" />
        </motion.svg>
      </motion.button>

      {/* Overlay для закрытия меню */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-transparent backdrop-blur-md z-[9998]"
          onClick={closeMenu}
        />
      )}

      {/* Меню выдвигающееся сверху вниз */}
      <motion.div
        className="fixed top-0 left-0 right-0 max-h-[85vh] w-full bg-black/80 backdrop-blur-3xl border-b border-white/10 z-[9999] shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-y-auto"
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: isMenuOpen ? 0 : "-100%", opacity: isMenuOpen ? 1 : 0 }}
        transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex flex-col min-h-full p-8 max-w-2xl mx-auto">
          {/* Навигационные ссылки - центрированные */}
          <nav className="flex-1 space-y-1 py-8">
            {/* Основная навигация - центрированная */}
            <div>
              <ul className="space-y-1">
                {/* Главная */}
                {currentPage !== "home" && (
                  <li>
                    <button
                      onClick={handleHomeClick}
                      className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-white/5 transition-all duration-200 text-center font-medium"
                    >
                      <span>{TEXTS[language].navigation.home}</span>
                    </button>
                  </li>
                )}

                {/* My Workouts */}
                {user && (
                  <li>
                    <button
                      onClick={handleMyWorkoutsClick}
                      className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-white/5 transition-all duration-200 text-center font-medium"
                    >
                      <span>{TEXTS[language].navigation.myWorkouts}</span>
                    </button>
                  </li>
                )}

                <li>
                  <button
                    onClick={handleArticlesClick}
                    className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-white/5 transition-all duration-200 text-center font-medium"
                  >
                    <span>{TEXTS[language].navigation.articles}</span>
                  </button>
                </li>

                {user && hasSubscription && (
                  <li>
                    <button
                      onClick={handleTelegramChatClick}
                      className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-white/5 transition-all duration-200 text-center font-medium"
                    >
                      <span>{TEXTS[language].navigation.telegramChat}</span>
                    </button>
                  </li>
                )}

                {showSubscribeCta && (
                  <li>
                    <button
                      onClick={handleSubscribeClick}
                      className="w-full flex items-center justify-center p-4 rounded-xl text-brand-400 hover:bg-brand-500/10 transition-all duration-200 text-center font-semibold border border-brand-500/30"
                    >
                      <span>{TEXTS[language].navigation.getAccess}</span>
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
                    <li className="my-3">
                      <div className="h-px bg-white/10"></div>
                    </li>
                    <li>
                      <button
                        onClick={handleAdminPanelClick}
                        className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-yellow-500/20 transition-all duration-200 text-center font-medium border border-yellow-500/30 hover:border-yellow-500/60"
                      >
                        <span>{TEXTS[language].navigation.adminPanel}</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleAdminSubscriptionsClick}
                        className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-yellow-500/20 transition-all duration-200 text-center font-medium border border-yellow-500/30 hover:border-yellow-500/60"
                      >
                        <span>{TEXTS[language].navigation.subscriptions}</span>
                      </button>
                    </li>
                  </>
                )}

                {/* Разделитель */}
                <li className="my-3">
                  <div className="h-px bg-white/10"></div>
                </li>

                {/* Профиль */}
                <li>
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-white/5 transition-all duration-200 text-center font-medium"
                  >
                    <span>{user ? TEXTS[language].navigation.profile : TEXTS[language].auth.signIn}</span>
                  </button>
                </li>

                {/* Отзывы */}
                <li>
                  <button
                    onClick={() => {
                      setIsReviewsModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center p-4 rounded-xl text-white hover:bg-white/5 transition-all duration-200 text-center font-medium"
                  >
                    <span>{language === 'en' ? 'Leave Review' : 'Оставить отзыв'}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Выход - если пользователь авторизован */}
            {user && (
              <div className="pt-3 border-t border-white/10">
                <button
                  onClick={handleLogoutWithClose}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center p-4 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? (language === "en" ? "Signing out..." : "Выход...") : TEXTS[language].navigation.logout}</span>
                </button>
              </div>
            )}

            {/* Переключатель языков */}
            <div className="pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setIsLanguageChanging(true);
                  toggleLanguage();
                  setTimeout(() => setIsLanguageChanging(false), 300);
                }}
                disabled={isLanguageChanging}
                className="w-full flex items-center justify-center p-4 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <span>
                  {language === 'en' ? 'ENG' : 'RU'}
                </span>
              </button>
            </div>

            {/* Подвал */}
            <div className="pt-6 pb-4 border-t border-white/10 flex flex-col items-center gap-3">
              <p className="text-white/40 text-xs text-center font-light">
                Pure.Progression
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                aria-label={
                  language === "ru"
                    ? "Pure.Progression в Instagram"
                    : "Pure.Progression on Instagram"
                }
              >
                <svg
                  className="block h-[22px] w-[22px] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </a>
            </div>
          </nav>
        </div>
      </motion.div>

      {/* Модалка отзывов */}
      <ReviewsModal 
        isOpen={isReviewsModalOpen} 
        onClose={() => setIsReviewsModalOpen(false)} 
      />
    </>
  );

  // Рендерим Navigation через Portal в document.body
  if (!mounted) return null;
  return createPortal(menuContent, document.body);
}
