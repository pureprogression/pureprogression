"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { TEXTS } from "@/constants/texts";
import { getFeaturedArticles } from "@/constants/articles";

export default function HomeIntro({ user = null, onGetAccess }) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = TEXTS[language].home.intro;
  const featured = getFeaturedArticles(2);

  const scrollToBuilder = () => {
    document.getElementById("workout-builder")?.scrollIntoView({ behavior: "smooth" });
  };

  const valueItems = [
    { label: t.valueVideo, icon: "▶" },
    { label: t.valueBuilder, icon: "✦" },
    { label: t.valueGuides, icon: "◎" },
  ];

  return (
    <section className="relative pt-20 pb-10 px-4">
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.p
          className="text-white/45 text-xs font-medium uppercase tracking-[0.18em] mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {t.brand}
        </motion.p>

        <motion.h1
          className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight mb-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t.title}
        </motion.h1>

        <motion.p
          className="text-white/50 text-base leading-relaxed max-w-lg mx-auto mb-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-2 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {valueItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60"
            >
              <span className="text-white/40">{item.icon}</span>
              {item.label}
            </span>
          ))}
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            type="button"
            onClick={scrollToBuilder}
            className="px-6 py-3.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            {t.openBuilder}
          </button>
          <button
            type="button"
            onClick={() => router.push("/articles")}
            className="px-6 py-3.5 rounded-full border border-white/20 text-white/80 text-sm font-medium hover:bg-white/5 transition-colors"
          >
            {t.allGuides}
          </button>
        </motion.div>

        {user && onGetAccess && (
          <motion.button
            type="button"
            onClick={onGetAccess}
            className="mb-6 text-brand-400 text-sm font-medium hover:text-brand-300 transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {TEXTS[language].subscription.subscribeNow} →
          </motion.button>
        )}

        {!user && <p className="text-white/30 text-xs mb-8">{t.freeToTry}</p>}
        {user && !onGetAccess && <p className="text-white/30 text-xs mb-8">{t.freeToTry}</p>}
      </div>

      <div className="relative max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-white/70 text-sm font-medium tracking-wide">
            {t.guidesTitle}
          </h2>
          <button
            type="button"
            onClick={() => router.push("/articles")}
            className="text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            {t.allGuides} →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {featured.map((article, index) => (
            <motion.button
              key={article.slug}
              type="button"
              onClick={() => router.push(`/articles/${article.slug}`)}
              className="relative text-left rounded-2xl overflow-hidden h-36 group border border-white/8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
                style={{ backgroundImage: `url(${article.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-4">
                <span className="text-white/50 text-[10px] font-medium mb-1 uppercase tracking-wide">
                  {language === "en" ? article.categoryEn : article.category}
                </span>
                <p className="text-white text-sm font-medium line-clamp-2 leading-snug">
                  {language === "en" ? article.titleEn : article.title}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto mt-10 flex justify-center">
        <button
          type="button"
          onClick={scrollToBuilder}
          className="text-white/30 text-xs flex flex-col items-center gap-1 hover:text-white/50 transition-colors"
          aria-label={t.scrollHint}
        >
          <span>{t.scrollHint}</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </section>
  );
}
