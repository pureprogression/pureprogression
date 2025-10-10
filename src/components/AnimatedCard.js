"use client";

import { motion } from "framer-motion";

const cardVariants = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
    transition: { duration: 0.3, ease: "easeOut" }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

const contentVariants = {
  rest: {
    y: 0
  },
  hover: {
    y: -5,
    transition: { duration: 0.3 }
  }
};

export default function AnimatedCard({ 
  children, 
  className = "",
  onClick,
  hoverable = true,
  delay = 0,
  ...props 
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial={{ opacity: 0, y: 20, ...cardVariants.rest }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? "hover" : "rest"}
      whileTap={onClick ? "tap" : "rest"}
      onClick={onClick}
      className={`bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      transition={{ 
        duration: 0.5, 
        delay: delay,
        ease: "easeOut"
      }}
      {...props}
    >
      <motion.div
        variants={contentVariants}
        className="h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
