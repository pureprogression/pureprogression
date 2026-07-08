"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { TEXTS } from "@/constants/texts";

export default function ConversionBanner() {
  const router = useRouter();
  const { language } = useLanguage();
  const texts = TEXTS[language].subscription;

  return (
    <div className="fixed top-14 left-0 right-0 z-[9990] px-3 pointer-events-none">
      <button
        type="button"
        onClick={() => router.push("/subscribe")}
        className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-3 rounded-xl border border-brand-500/30 bg-black/85 backdrop-blur-xl px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-colors hover:border-brand-500/50 hover:bg-black/90"
      >
        <span className="text-left text-sm text-white/90 leading-snug">{texts.homeBanner}</span>
        <span className="shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-black">
          {texts.homeBannerCta}
        </span>
      </button>
    </div>
  );
}
