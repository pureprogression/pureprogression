"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PremiumModal({ isOpen, onClose, onUpgrade, feature = "this feature", requiresAuth = false, customMessage }) {
  const { language } = useLanguage();
  const router = useRouter();
  
  if (!isOpen) return null;

  const handleSubscribe = () => {
    onClose();
    router.push('/subscribe');
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
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <div className="w-4 h-4 rounded-full bg-white" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white mb-3">
              {requiresAuth 
                ? (language === 'en' ? 'Sign In Required' : 'Требуется авторизация')
                : (language === 'en' ? 'Premium Subscription Required' : 'Требуется подписка')
              }
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {customMessage || (
                requiresAuth
                  ? (language === 'en' 
                      ? `To access ${feature}, please sign in to your account.`
                      : `Для доступа к ${feature}, пожалуйста, войдите в свой аккаунт.`)
                  : (language === 'en'
                      ? `To access ${feature}, you need an active subscription. Subscribe now to get full access!`
                      : `Для доступа к ${feature} требуется активная подписка. Оформите подписку прямо сейчас!`)
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
                  {language === 'en' ? 'Sign In' : 'Войти'}
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
                  onClick={handleSubscribe}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium hover:from-green-400 hover:to-emerald-400 transition-all duration-300"
                >
                  {language === 'en' ? 'Subscribe Now' : 'Оформить подписку'}
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
