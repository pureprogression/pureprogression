"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FinalCTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const router = useRouter();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push('/subscribe');
    } else {
      router.push('/auth');
    }
  };

  return (
    <section 
      ref={ref}
      className="relative min-h-screen w-full bg-black flex items-center justify-center"
    >
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-light text-white mb-6">
            {language === 'ru' 
              ? 'Готовы начать?'
              : 'Ready to start?'
            }
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-light mb-12 px-4">
            {language === 'ru'
              ? 'Присоединяйтесь к тысячам пользователей, которые уже достигли своих целей'
              : 'Join thousands of users who have already achieved their goals'
            }
          </p>
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 sm:px-12 py-4 sm:py-5 bg-white text-black rounded-full text-lg sm:text-xl font-medium hover:bg-white/90 transition-colors"
          >
            {language === 'ru' ? 'Начать сейчас' : 'Start Now'}
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

