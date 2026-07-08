"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { saveReview } from "@/lib/firebase";

export default function ReviewsModal({ isOpen, onClose }) {
  const { language } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    
    try {
      const reviewData = {
        rating,
        name: name.trim() || 'Аноним',
        email: email.trim() || '',
        review: review.trim() || '',
        language,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      const result = await saveReview(reviewData);
      
      if (result.success) {
        setIsSubmitted(true);
        // Автоматически закрываем через 3 секунды
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Ошибка при отправке отзыва:', error);
      alert(
        language === 'en' 
          ? `Error saving review: ${error.message}` 
          : `Ошибка сохранения отзыва: ${error.message}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setReview("");
    setName("");
    setEmail("");
    setIsSubmitted(false);
    onClose();
  };

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating) => {
    setHoverRating(starRating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const renderEmojiRating = () => {
    const emojis = [
      { emoji: '😞', label: language === 'en' ? 'Poor' : 'Плохо' },
      { emoji: '😐', label: language === 'en' ? 'Fair' : 'Удовлетворительно' },
      { emoji: '🙂', label: language === 'en' ? 'Good' : 'Хорошо' },
      { emoji: '😊', label: language === 'en' ? 'Very Good' : 'Очень хорошо' },
      { emoji: '🤩', label: language === 'en' ? 'Excellent' : 'Отлично' }
    ];

    return emojis.map((item, index) => {
      const emojiValue = index + 1;
      const isActive = emojiValue <= (hoverRating || rating);
      
      return (
        <motion.button
          key={index}
          type="button"
          onClick={() => handleStarClick(emojiValue)}
          onMouseEnter={() => handleStarHover(emojiValue)}
          onMouseLeave={handleStarLeave}
          className="text-3xl focus:outline-none transition-all duration-200 p-2 hover:scale-110"
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <span className={isActive ? "opacity-100" : "opacity-40"}>
            {item.emoji}
          </span>
        </motion.button>
      );
    });
  };

  const texts = {
    en: {
      title: "Leave a Review",
      subtitle: "Your feedback helps us improve",
      ratingLabel: "Rating",
      nameLabel: "Name (optional)",
      emailLabel: "Email (optional)",
      reviewLabel: "Your review",
      reviewPlaceholder: "Tell us about your experience...",
      submitButton: "Submit Review",
      submitting: "Submitting...",
      success: "Thank you for your review!",
      successSubtitle: "Your review will be published after moderation",
      close: "Close"
    },
    ru: {
      title: "Оставить отзыв",
      subtitle: "Ваш отзыв поможет нам стать лучше",
      ratingLabel: "Оценка",
      nameLabel: "Имя (необязательно)",
      emailLabel: "Email (необязательно)",
      reviewLabel: "Ваш отзыв",
      reviewPlaceholder: "Расскажите о вашем опыте...",
      submitButton: "Отправить отзыв",
      submitting: "Отправляем...",
      success: "Спасибо за ваш отзыв!",
      successSubtitle: "Ваш отзыв будет опубликован после модерации",
      close: "Закрыть"
    }
  };

  const t = texts[language];

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-transparent backdrop-blur-2xl"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
            className="relative w-full max-w-sm bg-white/10 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] overflow-hidden border border-white/20 backdrop-blur-2xl"
          >
            {isSubmitted ? (
              /* Success State */
              <div className="p-8 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-6"
                >
                  <div className="w-12 h-12 mx-auto bg-brand-500 rounded-full flex items-center justify-center">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="text-2xl text-white"
                    >
                      ✓
                    </motion.span>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="space-y-3"
                >
                  <h2 className="text-lg font-semibold text-white">
                    {t.success}
                  </h2>
                  
                  <p className="text-sm text-white/80 leading-relaxed">
                    {t.successSubtitle}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="mt-8"
                >
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-white/80 hover:text-white transition-colors duration-200"
                  >
                    {t.close}
                  </button>
                </motion.div>
              </div>
            ) : (
              /* Review Form */
              <div className="p-6">
                {/* Header */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center mb-6"
                >
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {t.title}
                  </h2>
                  <p className="text-sm text-white/80">
                    {t.subtitle}
                  </p>
                </motion.div>

                <motion.form 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                >
                  {/* Rating */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="text-center"
                  >
                    <label className="block text-sm font-semibold text-white/80 mb-3">
                      {t.ratingLabel} *
                    </label>
                    <div className="flex justify-center space-x-1 mb-3">
                      {renderEmojiRating()}
                    </div>
                    {rating > 0 && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-white/60 font-medium"
                      >
                        {rating === 1 && (language === 'en' ? 'Poor' : 'Плохо')}
                        {rating === 2 && (language === 'en' ? 'Fair' : 'Удовлетворительно')}
                        {rating === 3 && (language === 'en' ? 'Good' : 'Хорошо')}
                        {rating === 4 && (language === 'en' ? 'Very Good' : 'Очень хорошо')}
                        {rating === 5 && (language === 'en' ? 'Excellent' : 'Отлично')}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                  >
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 text-sm"
                      placeholder={language === 'en' ? 'Your name' : 'Ваше имя'}
                    />
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      {t.emailLabel}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 text-sm"
                      placeholder={language === 'en' ? 'your@email.com' : 'ваш@email.com'}
                    />
                  </motion.div>

                  {/* Review */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      {t.reviewLabel}
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all duration-200 resize-none text-sm"
                      placeholder={t.reviewPlaceholder}
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className="w-full py-3 px-4 bg-white/15 text-white rounded-lg hover:bg-white/25 disabled:bg-white/10 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                    whileHover={{ scale: rating > 0 ? 1.02 : 1 }}
                    whileTap={{ scale: rating > 0 ? 0.98 : 1 }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{t.submitting}</span>
                      </div>
                    ) : (
                      t.submitButton
                    )}
                  </motion.button>
                </motion.form>

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}