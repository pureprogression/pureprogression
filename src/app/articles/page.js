"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getArticlesForDisplay } from "@/constants/articles";

export default function ArticlesPage() {
  const router = useRouter();
  const { user } = useSubscription();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const articles = getArticlesForDisplay();

  useEffect(() => {
    setMounted(true);
  }, []);

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
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                className="relative rounded-xl overflow-hidden cursor-pointer group h-64"
                onClick={() => router.push(`/articles/${article.slug}`)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                  style={{ backgroundImage: `url(${article.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
                <div className="relative h-full flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-brand-400 text-xs font-medium px-2 py-1 rounded bg-brand-500/20 backdrop-blur-sm">
                        {language === "en" ? article.categoryEn : article.category}
                      </span>
                      <span className="text-white/60 text-xs">
                        {article.readTime} {language === "en" ? "min" : "мин"}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {language === "en" ? article.titleEn : article.title}
                    </h2>
                  </div>
                  <p className="text-white/80 text-sm line-clamp-2">
                    {language === "en" ? article.excerptEn : article.excerpt}
                  </p>
                  <div className="absolute bottom-6 right-6">
                    <svg
                      className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
