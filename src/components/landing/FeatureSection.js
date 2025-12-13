"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FeatureSection({ 
  title, 
  titleEn,
  description, 
  descriptionEn,
  videoSrc,
  imageSrc,
  reverse = false,
  children 
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const { language } = useLanguage();

  return (
    <section 
      ref={ref}
      className="relative min-h-screen w-full overflow-hidden bg-black flex items-center py-12 md:py-0"
    >
      <div className={`container mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-8 md:gap-12 ${reverse ? 'md:flex-row-reverse' : ''}`}>
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6 z-10 text-center md:text-left">
          <motion.h2
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? 50 : -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-7xl font-light text-white"
          >
            {language === 'ru' ? title : titleEn}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: reverse ? 50 : -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? 50 : -50 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl md:text-2xl text-white/80 font-light max-w-lg"
          >
            {language === 'ru' ? description : descriptionEn}
          </motion.p>
          {children}
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-lg aspect-video"
          >
            {videoSrc && (
              <video
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src={videoSrc} type="video/mp4" />
              </video>
            )}
            {imageSrc && (
              <img
                src={imageSrc}
                alt={language === 'ru' ? title : titleEn}
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

