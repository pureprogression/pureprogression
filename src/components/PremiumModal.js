"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PremiumModal({ isOpen, onClose, onUpgrade, feature = "this feature" }) {
  const { language } = useLanguage();
  if (!isOpen) return null;

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
              {language === 'en' ? 'Premium Feature' : 'Премиум функция'}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {language === 'en' 
                ? `To access ${feature}, please upgrade to Premium for unlimited workouts, advanced analytics, and exclusive content.`
                : `Для доступа к ${feature}, пожалуйста, обновитесь до Премиум для неограниченных тренировок, расширенной аналитики и эксклюзивного контента.`
              }
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-2">
            <button
              onClick={onUpgrade}
              className="w-full bg-white/15 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/25 transition-all duration-300"
            >
              {language === 'en' ? 'Upgrade to Premium' : 'Обновить до Премиум'}
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-white/10 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/20 transition-all duration-300"
            >
              {language === 'en' ? 'Maybe Later' : 'Возможно позже'}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
