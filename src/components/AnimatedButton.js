"use client";

import { motion } from "framer-motion";

const buttonVariants = {
  rest: { 
    scale: 1,
    boxShadow: "0 0 0 rgba(255, 255, 255, 0)"
  },
  hover: { 
    scale: 1.05,
    boxShadow: "0 10px 25px rgba(255, 255, 255, 0.1)",
    transition: { duration: 0.2 }
  },
  tap: { 
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

const rippleVariants = {
  initial: {
    scale: 0,
    opacity: 0.6
  },
  animate: {
    scale: 1,
    opacity: 0,
    transition: { duration: 0.6 }
  }
};

export default function AnimatedButton({ 
  children, 
  onClick, 
  className = "", 
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  ...props 
}) {
  const baseClasses = "relative overflow-hidden font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-400 hover:to-blue-400",
    secondary: "bg-white/10 text-white border border-white/20 hover:bg-white/20",
    danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400",
    ghost: "text-white hover:bg-white/10"
  };
  
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-6 py-4 text-lg"
  };

  return (
    <motion.button
      variants={buttonVariants}
      initial="rest"
      whileHover={!disabled && !loading ? "hover" : "rest"}
      whileTap={!disabled && !loading ? "tap" : "rest"}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-lg"
        variants={rippleVariants}
        initial="initial"
        whileTap="animate"
      />
      
      {/* Loading spinner */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
        </motion.div>
      )}
      
      {/* Button content */}
      <span className={`relative z-10 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </motion.button>
  );
}
