"use client";

import { motion } from "framer-motion"

export default function Hero() {

  return (
    <main className="relative h-screen w-screen">
      
      <video 
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        preload="auto"
      >
        <source src="/videos/webHero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>


         {/* Чистый градиент без текста и motion */}
      <div className="absolute bottom-0 w-full h-52 bg-gradient-to-b from-transparent to-black/90 z-20 pointer-events-none" />
{/* Текст поверх видео */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4"
      >
      
      </motion.div>

      <div className="relative z-10 flex flex-col h-full text-white p-6">
        {/* Контент Hero */}
      </div>
    </main>
  );
}

