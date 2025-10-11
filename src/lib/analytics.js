// Google Analytics event tracking utility

export const trackEvent = (action, category = 'engagement', label = '', value = 0) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Specific tracking functions
export const trackRegistration = (method = 'email') => {
  trackEvent('sign_up', 'user', method);
};

export const trackLogin = (method = 'email') => {
  trackEvent('login', 'user', method);
};

export const trackWorkoutCreated = (exerciseCount = 0) => {
  trackEvent('workout_created', 'fitness', 'workout_builder', exerciseCount);
};

export const trackExerciseFavorited = (exerciseTitle = '') => {
  trackEvent('exercise_favorited', 'fitness', exerciseTitle);
};

export const trackWorkoutCompleted = (workoutName = '') => {
  trackEvent('workout_completed', 'fitness', workoutName);
};

export const trackPremiumUpgrade = (plan = 'premium') => {
  trackEvent('purchase', 'ecommerce', plan, 9.99);
};

export const trackPageView = (pageName = '') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
      page_title: document.title,
      page_location: window.location.href,
      custom_map: { custom_parameter: pageName }
    });
  }
};
