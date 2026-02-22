"use client";

import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { TEXTS } from "@/constants/texts";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user } = useSubscription();

  return (
    <>
      <Navigation currentPage="home" user={user} />
      <div className="min-h-screen bg-black pt-16 pb-8 px-4">
        <div className="max-w-md mx-auto">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl font-bold text-white mb-3">
              {TEXTS[language].home.choice.title}
            </h1>
            <p className="text-white/50 text-base">
              {language === 'en' 
                ? 'Choose how you want to create your workout'
                : 'Выберите, как вы хотите создать свою тренировку'}
            </p>
          </motion.div>

          {/* Карточки выбора - мобильная версия */}
          <div className="space-y-4">
            {/* Конструктор тренировок */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={() => router.push('/builder')}
              className="group relative bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-6 border border-white/10 active:scale-[0.98] cursor-pointer transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-active:bg-white/20 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {TEXTS[language].home.choice.builder.title}
                </h2>
                <p className="text-white/60 text-sm mb-4">
                  {TEXTS[language].home.choice.builder.description}
                </p>
                <div className="w-full bg-white text-black py-3 px-6 rounded-lg font-semibold text-center">
                  {TEXTS[language].home.choice.builder.button}
                </div>
              </div>
            </motion.div>

            {/* Персональная программа */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              onClick={() => router.push('/training-program')}
              className="group relative bg-gradient-to-br from-white/5 to-white/0 rounded-2xl p-6 border border-white/10 active:scale-[0.98] cursor-pointer transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mb-4 group-active:bg-white/20 transition-colors">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {TEXTS[language].home.choice.personal.title}
                </h2>
                <p className="text-white/60 text-sm mb-4">
                  {TEXTS[language].home.choice.personal.description}
                </p>
                <div className="w-full bg-white text-black py-3 px-6 rounded-lg font-semibold text-center">
                  {TEXTS[language].home.choice.personal.button}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
