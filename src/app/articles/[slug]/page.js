"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";

// Заглушки статей (завтра заменим на реальные)
const ARTICLES = {
  'how-to-start-training': {
    id: '1',
    slug: 'how-to-start-training',
    title: 'Как начать тренироваться: руководство для новичков',
    titleEn: 'How to Start Training: A Beginner\'s Guide',
    category: 'Тренировки',
    categoryEn: 'Training',
    readTime: 5,
    date: '2024-01-15',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    content: `
      <h2>Введение</h2>
      <p>Начало тренировок может показаться сложным, но с правильным подходом это станет увлекательным путешествием к здоровью и силе.</p>
      
      <h2>С чего начать</h2>
      <p>Первый шаг - определить ваши цели. Хотите ли вы похудеть, набрать мышечную массу или просто улучшить общее состояние здоровья?</p>
      
      <h2>Основные принципы</h2>
      <ul>
        <li>Начинайте постепенно</li>
        <li>Слушайте свое тело</li>
        <li>Будьте последовательны</li>
        <li>Не забывайте о восстановлении</li>
      </ul>
      
      <h2>Заключение</h2>
      <p>Помните, что каждый эксперт когда-то был новичком. Главное - начать и не останавливаться.</p>
    `,
    contentEn: `
      <h2>Introduction</h2>
      <p>Starting to train can seem daunting, but with the right approach, it becomes an exciting journey to health and strength.</p>
      
      <h2>Where to Start</h2>
      <p>The first step is to determine your goals. Do you want to lose weight, gain muscle mass, or simply improve your overall health?</p>
      
      <h2>Basic Principles</h2>
      <ul>
        <li>Start gradually</li>
        <li>Listen to your body</li>
        <li>Be consistent</li>
        <li>Don't forget about recovery</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Remember that every expert was once a beginner. The main thing is to start and not stop.</p>
    `,
    isPremium: false
  },
  'nutrition-basics': {
    id: '2',
    slug: 'nutrition-basics',
    title: 'Основы правильного питания для спортсменов',
    titleEn: 'Nutrition Basics for Athletes',
    category: 'Питание',
    categoryEn: 'Nutrition',
    readTime: 7,
    date: '2024-01-14',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&q=80',
    content: `
      <h2>Введение</h2>
      <p>Правильное питание - это основа успеха в любом виде спорта и фитнеса.</p>
      
      <h2>Белки</h2>
      <p>Белки необходимы для восстановления и роста мышц. Рекомендуется потреблять 1.6-2.2 г на кг веса тела.</p>
      
      <h2>Углеводы</h2>
      <p>Углеводы - основной источник энергии. Особенно важны перед и после тренировок.</p>
      
      <h2>Жиры</h2>
      <p>Жиры важны для гормональной функции и усвоения витаминов. Не стоит их полностью исключать.</p>
      
      <h2>Заключение</h2>
      <p>Сбалансированное питание - ключ к достижению ваших целей.</p>
    `,
    contentEn: `
      <h2>Introduction</h2>
      <p>Proper nutrition is the foundation of success in any sport and fitness.</p>
      
      <h2>Proteins</h2>
      <p>Proteins are necessary for muscle recovery and growth. It is recommended to consume 1.6-2.2 g per kg of body weight.</p>
      
      <h2>Carbohydrates</h2>
      <p>Carbohydrates are the main source of energy. Especially important before and after workouts.</p>
      
      <h2>Fats</h2>
      <p>Fats are important for hormonal function and vitamin absorption. You shouldn't completely exclude them.</p>
      
      <h2>Conclusion</h2>
      <p>Balanced nutrition is the key to achieving your goals.</p>
    `,
    isPremium: false
  },
  'recovery-importance': {
    id: '3',
    slug: 'recovery-importance',
    title: 'Важность восстановления после тренировок',
    titleEn: 'The Importance of Post-Workout Recovery',
    category: 'Восстановление',
    categoryEn: 'Recovery',
    readTime: 6,
    date: '2024-01-13',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80',
    content: `
      <h2>Введение</h2>
      <p>Восстановление - это неотъемлемая часть тренировочного процесса, которую часто недооценивают.</p>
      
      <h2>Почему это важно</h2>
      <p>Во время тренировок мы создаем микротравмы в мышцах. Восстановление позволяет мышцам восстановиться и стать сильнее.</p>
      
      <h2>Методы восстановления</h2>
      <ul>
        <li>Сон (7-9 часов)</li>
        <li>Правильное питание</li>
        <li>Растяжка</li>
        <li>Активное восстановление</li>
      </ul>
      
      <h2>Заключение</h2>
      <p>Помните: прогресс происходит не во время тренировки, а во время восстановления.</p>
    `,
    contentEn: `
      <h2>Introduction</h2>
      <p>Recovery is an integral part of the training process that is often underestimated.</p>
      
      <h2>Why It's Important</h2>
      <p>During training, we create microtraumas in muscles. Recovery allows muscles to recover and become stronger.</p>
      
      <h2>Recovery Methods</h2>
      <ul>
        <li>Sleep (7-9 hours)</li>
        <li>Proper nutrition</li>
        <li>Stretching</li>
        <li>Active recovery</li>
      </ul>
      
      <h2>Conclusion</h2>
      <p>Remember: progress happens not during training, but during recovery.</p>
    `,
    isPremium: false
  }
};

export default function ArticlePage() {
  const router = useRouter();
  const params = useParams();
  const { user, hasSubscription } = useSubscription();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [article, setArticle] = useState(null);

  useEffect(() => {
    setMounted(true);
    const slug = params.slug;
    const foundArticle = ARTICLES[slug];
    if (foundArticle) {
      setArticle(foundArticle);
    }
  }, [params.slug]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <Navigation currentPage="articles" user={user} />
        <div className="min-h-screen bg-black pt-20 pb-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 mb-4">
              {language === 'en' ? 'Article not found' : 'Статья не найдена'}
            </p>
            <button
              onClick={() => router.push('/articles')}
              className="text-green-400 hover:text-green-300"
            >
              {language === 'en' ? 'Back to articles' : 'Вернуться к статьям'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation currentPage="articles" user={user} />
      <div className="min-h-screen bg-black pt-20 pb-20">
        <div className="max-w-3xl mx-auto px-4">
          {/* Кнопка назад */}
          <button
            onClick={() => router.push('/articles')}
            className="text-white/60 hover:text-white mb-6 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>{language === 'en' ? 'Back to articles' : 'Вернуться к статьям'}</span>
          </button>

          {/* Hero-баннер с изображением */}
          <motion.div
            className="relative rounded-xl overflow-hidden mb-8 h-64 md:h-80"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Фоновое изображение */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${article.image})` }}
            />
            
            {/* Затемнение */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
            
            {/* Контент поверх изображения */}
            <div className="relative h-full flex flex-col justify-end p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-green-400 text-xs font-medium px-2 py-1 rounded bg-green-500/20 backdrop-blur-sm">
                  {language === 'en' ? article.categoryEn : article.category}
                </span>
                <span className="text-white/60 text-xs">
                  {article.readTime} {language === 'en' ? 'min read' : 'мин чтения'}
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">
                {language === 'en' ? article.titleEn : article.title}
              </h1>
            </div>
          </motion.div>

          {/* Содержание статьи */}
          <motion.article
            className="max-w-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div 
              className="article-content text-white/90 leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ 
                __html: language === 'en' ? article.contentEn : article.content 
              }}
            />
          </motion.article>
        </div>
      </div>
    </>
  );
}

