"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
};

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.3
};


export default function PageTransition({ children }) {
  // Временно отключаем анимации для диагностики производительности
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
