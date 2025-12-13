"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";

// Заглушки статей (завтра заменим на реальные)
const ARTICLES = [
  {
    id: '1',
    slug: 'how-to-start-training',
    title: 'Как начать тренироваться: руководство для новичков',
    titleEn: 'How to Start Training: A Beginner\'s Guide',
    excerpt: 'Пошаговое руководство для тех, кто только начинает свой путь в фитнесе. Узнайте, с чего начать и как избежать типичных ошибок.',
    excerptEn: 'Step-by-step guide for those just starting their fitness journey. Learn where to start and how to avoid common mistakes.',
    category: 'Тренировки',
    categoryEn: 'Training',
    readTime: 5,
    date: '2024-01-15',
    isPremium: false,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'
  },
  {
    id: '2',
    slug: 'nutrition-basics',
    title: 'Основы правильного питания для спортсменов',
    titleEn: 'Nutrition Basics for Athletes',
    excerpt: 'Важные принципы питания, которые помогут достичь ваших фитнес-целей. Белки, углеводы, жиры и их роль в тренировках.',
    excerptEn: 'Important nutrition principles that will help you achieve your fitness goals. Proteins, carbohydrates, fats and their role in training.',
    category: 'Питание',
    categoryEn: 'Nutrition',
    readTime: 7,
    date: '2024-01-14',
    isPremium: false,
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80'
  },
  {
    id: '3',
    slug: 'recovery-importance',
    title: 'Важность восстановления после тренировок',
    titleEn: 'The Importance of Post-Workout Recovery',
    excerpt: 'Почему восстановление так же важно, как и сами тренировки. Методы восстановления и их влияние на прогресс.',
    excerptEn: 'Why recovery is just as important as training itself. Recovery methods and their impact on progress.',
    category: 'Восстановление',
    categoryEn: 'Recovery',
    readTime: 6,
    date: '2024-01-13',
    isPremium: false,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80'
  }
];

export default function ArticlesPage() {
  const router = useRouter();
  const { user, hasSubscription } = useSubscription();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation currentPage="articles" user={user} />
      <div className="min-h-screen bg-black pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Заголовок */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === 'en' ? 'Useful Materials' : 'Полезные материалы'}
            </h1>
            <p className="text-white/60 text-base">
              {language === 'en' 
                ? 'Articles and guides to help you achieve your fitness goals'
                : 'Статьи и руководства, которые помогут достичь ваших фитнес-целей'}
            </p>
          </motion.div>

          {/* Список статей */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ARTICLES.map((article, index) => (
              <motion.div
                key={article.id}
                className="relative rounded-xl overflow-hidden cursor-pointer group h-64"
                onClick={() => router.push(`/articles/${article.slug}`)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Фоновое изображение */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${article.image})` }}
                />
                
                {/* Затемнение */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
                
                {/* Контент */}
                <div className="relative h-full flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-green-400 text-xs font-medium px-2 py-1 rounded bg-green-500/20 backdrop-blur-sm">
                        {language === 'en' ? article.categoryEn : article.category}
                      </span>
                      <span className="text-white/60 text-xs">
                        {article.readTime} {language === 'en' ? 'min' : 'мин'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {language === 'en' ? article.titleEn : article.title}
                    </h2>
                  </div>
                  
                  <p className="text-white/80 text-sm line-clamp-2">
                    {language === 'en' ? article.excerptEn : article.excerpt}
                  </p>
                  
                  {/* Стрелка */}
                  <div className="absolute bottom-6 right-6">
                    <svg className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Заглушка для будущих статей */}
          <motion.div
            className="mt-12 text-center text-white/40 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>
              {language === 'en'
                ? 'More articles coming soon...'
                : 'Больше статей скоро...'}
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}

