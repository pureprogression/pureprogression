"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { createPlanRequest, getUserPlanRequests } from "@/lib/firebase";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: 'nutrition', key: 'nutrition', descKey: 'nutritionDesc' },
  { id: 'routine', key: 'routine', descKey: 'routineDesc' },
  { id: 'activity', key: 'activity', descKey: 'activityDesc' },
  { id: 'recovery', key: 'recovery', descKey: 'recoveryDesc' },
  { id: 'psychology', key: 'psychology', descKey: 'psychologyDesc' },
  { id: 'habits', key: 'habits', descKey: 'habitsDesc' }
];

export default function RequestPlanPage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    categories: [],
    goals: '',
    currentLevel: 'medium',
    limitations: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        await loadMyRequests(u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadMyRequests = async (userId) => {
    const result = await getUserPlanRequests(userId);
    if (result.success) {
      setMyRequests(result.requests);
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    if (formData.categories.length === 0) {
      alert(language === 'ru' ? 'Пожалуйста, выберите хотя бы одну категорию' : 'Please select at least one category');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPlanRequest(user.uid, formData);
      if (result.success) {
        setShowSuccess(true);
        setFormData({
          categories: [],
          goals: '',
          currentLevel: 'medium',
          limitations: '',
          additionalInfo: ''
        });
        await loadMyRequests(user.uid);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        alert(TEXTS[language].planRequest.error + ': ' + result.error);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert(TEXTS[language].planRequest.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return TEXTS[language].planRequest.statusNew;
      case 'in_progress':
        return TEXTS[language].planRequest.statusInProgress;
      case 'plan_created':
        return TEXTS[language].planRequest.statusPlanCreated;
      default:
        return status;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">{language === 'ru' ? 'Пожалуйста, войдите в систему' : 'Please sign in'}</p>
      </div>
    );
  }

  return (
    <>
      <Navigation currentPage="request-plan" user={user} />
      <div className="pt-20 min-h-screen bg-black">
        <div className="max-w-4xl mx-auto p-4">
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6"
            >
              <p className="text-green-400">{TEXTS[language].planRequest.success}</p>
            </motion.div>
          )}

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {TEXTS[language].planRequest.title}
              </h1>
              <p className="text-gray-400">
                {TEXTS[language].planRequest.subtitle}
              </p>
            </div>
            <button
              onClick={() => setShowMyRequests(!showMyRequests)}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              {TEXTS[language].planRequest.myRequests}
            </button>
          </div>

          {showMyRequests && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                {TEXTS[language].planRequest.myRequests}
              </h2>
              {myRequests.length === 0 ? (
                <p className="text-gray-400">{TEXTS[language].planRequest.noRequests}</p>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">
                          {formatDate(request.createdAt)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          request.status === 'new' ? 'bg-yellow-500/20 text-yellow-400' :
                          request.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>
                      {request.goals && (
                        <p className="text-gray-400 text-sm line-clamp-2">{request.goals}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            {/* Категории */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">
                {TEXTS[language].planRequest.categories}
              </label>
              <p className="text-gray-400 text-sm mb-4">
                {TEXTS[language].planRequest.selectCategories}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.categories.includes(category.id)
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-medium">
                        {TEXTS[language].planRequest[category.key]}
                      </h3>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        formData.categories.includes(category.id)
                          ? 'border-yellow-500 bg-yellow-500'
                          : 'border-white/30'
                      }`}>
                        {formData.categories.includes(category.id) && (
                          <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs">
                      {TEXTS[language].planRequest[category.descKey]}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Цели */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                {TEXTS[language].planRequest.goals}
              </label>
              <textarea
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder={TEXTS[language].planRequest.goalsPlaceholder}
                rows={4}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-500/50 focus:bg-white/15 transition-all"
              />
            </div>

            {/* Уровень активности */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                {TEXTS[language].planRequest.currentLevel}
              </label>
              <div className="flex gap-3">
                {['low', 'medium', 'high'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, currentLevel: level })}
                    className={`flex-1 py-3 rounded-lg border-2 transition-all ${
                      formData.currentLevel === level
                        ? 'border-yellow-500 bg-yellow-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {TEXTS[language].planRequest[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* Ограничения */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                {TEXTS[language].planRequest.limitations}
              </label>
              <textarea
                value={formData.limitations}
                onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                placeholder={TEXTS[language].planRequest.limitationsPlaceholder}
                rows={3}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-500/50 focus:bg-white/15 transition-all"
              />
            </div>

            {/* Дополнительная информация */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                {TEXTS[language].planRequest.additionalInfo}
              </label>
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                placeholder={TEXTS[language].planRequest.additionalInfoPlaceholder}
                rows={3}
                className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-yellow-500/50 focus:bg-white/15 transition-all"
              />
            </div>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold rounded-lg hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? TEXTS[language].planRequest.submitting : TEXTS[language].planRequest.submit}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}




