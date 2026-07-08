"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PremiumModal({
  isOpen,
  onClose,
  onUpgrade,
  feature = "this feature",
  requiresAuth = false,
  customMessage,
  customTitle,
  primaryLabel,
  variant = "default",
}) {
  const { language } = useLanguage();
  const router = useRouter();
  
  if (!isOpen) return null;

  const handlePrimary = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
      return;
    }
    router.push("/");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-transparent backdrop-blur-2xl z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="text-center mb-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                variant === "subscribe" ? "bg-brand-500/20" : "bg-white/20"
              }`}
            >
              {variant === "subscribe" ? (
                <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <div className="w-4 h-4 rounded-full bg-white" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-3">
              {customTitle ||
                (requiresAuth
                  ? language === "en"
                    ? "Sign In Required"
                    : "Требуется авторизация"
                  : language === "en"
                    ? "Account required"
                    : "Нужен аккаунт")}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {customMessage || (
                requiresAuth
                  ? (language === 'en' 
                      ? `To access ${feature}, please sign in to your account.`
                      : `Для доступа к ${feature}, пожалуйста, войдите в свой аккаунт.`)
                  : (language === 'en'
                      ? `Sign in to use ${feature}.`
                      : `Войдите в аккаунт, чтобы пользоваться ${feature}.`)
              )}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            {requiresAuth ? (
              <>
                <button
                  onClick={onUpgrade}
                  className="w-full bg-white/15 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/25 transition-all duration-300"
                >
                  {primaryLabel || (language === "en" ? "Sign In" : "Войти")}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-white/10 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/20 transition-all duration-300"
                >
                  {language === 'en' ? 'Maybe Later' : 'Возможно позже'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePrimary}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                    variant === "subscribe"
                      ? "bg-brand-500 text-black hover:bg-brand-400 shadow-[0_4px_20px_rgba(56,189,248,0.3)]"
                      : "bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-300"
                  }`}
                >
                  {primaryLabel || (language === "en" ? "Continue" : "Продолжить")}
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full bg-white/10 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/20 transition-all duration-300"
                >
                  {language === 'en' ? 'Maybe Later' : 'Возможно позже'}
                </button>
              </>
            )}
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
