"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useLanguage } from "@/contexts/LanguageContext";

const PLANS = {
  monthly: {
    name: 'Месяц',
    nameEn: 'Month',
    price: 990,
    period: 'мес',
    periodEn: 'mo',
    popular: false
  },
  '3months': {
    name: '3 месяца',
    nameEn: '3 Months',
    price: 2490,
    period: '3 мес',
    periodEn: '3 mo',
    savings: '16%',
    popular: true
  },
  yearly: {
    name: 'Год',
    nameEn: 'Year',
    price: 8290,
    period: 'год',
    periodEn: 'yr',
    savings: '30%',
    popular: false
  }
};

export default function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const router = useRouter();
  const { language } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSubscribe = (planType) => {
    if (user) {
      router.push(`/subscribe?plan=${planType}`);
    } else {
      router.push('/auth');
    }
  };

  return (
    <section 
      ref={ref}
      className="relative min-h-screen w-full bg-black py-20 flex items-center"
    >
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-light text-white mb-6">
            {language === 'ru' ? 'Выберите план' : 'Choose Your Plan'}
          </h2>
          <p className="text-lg sm:text-xl text-white/60 font-light">
            {language === 'ru' 
              ? 'Начните с 5 упражнений бесплатно'
              : 'Start with 5 exercises for free'
            }
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Object.entries(PLANS).map(([key, plan], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border ${
                plan.popular 
                  ? 'border-white/30 bg-white/10 scale-105' 
                  : 'border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white text-black px-4 py-1 rounded-full text-sm font-medium">
                    {language === 'ru' ? 'Популярный' : 'Popular'}
                  </span>
                </div>
              )}
              
              {plan.savings && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  -{plan.savings}
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-light text-white mb-4">
                  {language === 'ru' ? plan.name : plan.nameEn}
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-light text-white">
                    {plan.price}
                  </span>
                  <span className="text-xl text-white/60">
                    ₽/{language === 'ru' ? plan.period : plan.periodEn}
                  </span>
                </div>
              </div>

              <motion.button
                onClick={() => handleSubscribe(key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-4 rounded-full text-lg font-medium transition-colors ${
                  plan.popular
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                {language === 'ru' ? 'Оформить' : 'Subscribe'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

