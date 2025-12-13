"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function HeroSection() {
  const router = useRouter();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const baseUrl = `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL || 'https://pub-24028780ba564e299106a5335d66f54c.r2.dev'}/videos/`;
  const videoSrc = `${baseUrl}webHero.mp4`;

  const handleGetStarted = () => {
    if (user) {
      router.push('/subscribe');
    } else {
      router.push('/auth');
    }
  };

  if (!mounted) return null;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Video Background */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-light text-white mb-6 tracking-tight">
            Pure Progression
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-light mb-12 max-w-2xl mx-auto px-4">
            {language === 'ru' 
              ? 'Тренировки нового уровня'
              : 'Fitness at a new level'
            }
          </p>
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-black rounded-full text-base sm:text-lg font-medium hover:bg-white/90 transition-colors"
          >
            {language === 'ru' ? 'Начать' : 'Get Started'}
          </motion.button>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/50 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

