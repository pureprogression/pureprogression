"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getArticlesForDisplay, canAccessArticle } from "@/constants/articles";
import { TEXTS } from "@/constants/texts";

export default function ArticlesPage() {
  const router = useRouter();
  const { user, hasSubscription } = useSubscription();
  const { language } = useLanguage();
  const articleTexts = TEXTS[language].articlesPage;
  const [mounted, setMounted] = useState(false);
  const articles = getArticlesForDisplay();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleArticleClick = (article) => {
    router.push(`/articles/${article.slug}`);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-white">{language === "en" ? "Loading..." : "Загрузка..."}</div>
      </div>
    );
  }

  return (
    <>
      <Navigation currentPage="articles" user={user} />
      <div className="min-h-screen bg-app pt-20 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {language === "en" ? "Useful Materials" : "Полезные материалы"}
            </h1>
            <p className="text-white/60 text-base">
              {language === "en"
                ? "Articles and guides to help you achieve your fitness goals"
                : "Статьи и руководства, которые помогут достичь ваших фитнес-целей"}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.map((article, index) => {
              const locked = !canAccessArticle(article, hasSubscription);
              return (
                <motion.div
                  key={article.id}
                  className="relative rounded-xl overflow-hidden cursor-pointer group h-64"
                  onClick={() => handleArticleClick(article)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${article.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
                  {locked && (
                    <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
                  )}
                  <div className="relative h-full flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-brand-400 text-xs font-medium px-2 py-1 rounded bg-brand-500/20 backdrop-blur-sm">
                          {language === "en" ? article.categoryEn : article.category}
                        </span>
                        {article.isPremium && (
                          <span className="text-white/80 text-xs font-medium px-2 py-1 rounded bg-white/15 backdrop-blur-sm">
                            {articleTexts.premiumBadge}
                          </span>
                        )}
                        <span className="text-white/60 text-xs">
                          {article.readTime} {language === "en" ? "min" : "мин"}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {language === "en" ? article.titleEn : article.title}
                      </h2>
                    </div>
                    {locked ? (
                      <p className="text-brand-300 text-sm font-medium">{articleTexts.getAccess} →</p>
                    ) : (
                      <p className="text-white/80 text-sm line-clamp-2">
                        {language === "en" ? article.excerptEn : article.excerpt}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
