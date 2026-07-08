"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getArticleBySlug } from "@/constants/articles";

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
    const foundArticle = getArticleBySlug(slug);
    if (foundArticle) {
      setArticle(foundArticle);
    }
  }, [params.slug]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <>
        <Navigation currentPage="articles" user={user} />
        <div className="min-h-screen bg-app pt-20 pb-20 flex items-center justify-center">
          <div className="text-center">
            <p className="text-white/60 mb-4">
              {language === 'en' ? 'Article not found' : 'Статья не найдена'}
            </p>
            <button
              onClick={() => router.push('/articles')}
              className="text-brand-400 hover:text-brand-300"
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
      <div className="min-h-screen bg-app pt-20 pb-20">
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
                <span className="text-brand-400 text-xs font-medium px-2 py-1 rounded bg-brand-500/20 backdrop-blur-sm">
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

