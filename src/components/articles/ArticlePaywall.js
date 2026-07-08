"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { TEXTS } from "@/constants/texts";

export default function ArticlePaywall({ className = "" }) {
  const router = useRouter();
  const { language } = useLanguage();
  const texts = TEXTS[language].articlesPage;

  const handleGetAccess = () => {
    router.push("/subscribe");
  };

  return (
    <motion.div
      className={`rounded-2xl border border-brand-500/25 bg-brand-500/10 p-6 text-center ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <p className="text-white/60 text-sm mb-4 leading-relaxed">{texts.premiumUnlock}</p>
      <button
        type="button"
        onClick={handleGetAccess}
        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-500 text-black text-sm font-bold hover:bg-brand-400 transition-colors"
      >
        {texts.getAccess}
      </button>
    </motion.div>
  );
}
