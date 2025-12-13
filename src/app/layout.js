import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Analytics } from '@vercel/analytics/react';
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ErrorBoundary from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pure.Progression - Фитнес приложение",
  description: "Создавайте персональные тренировки с видео упражнениями",
  // Предзагрузка критичных ресурсов
  other: {
    'preload': [
      `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL || 'https://pub-24028780ba564e299106a5335d66f54c.r2.dev'}/videos/webHero.mp4`,
      `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL || 'https://pub-24028780ba564e299106a5335d66f54c.r2.dev'}/posters/webHero.jpg`
    ].join(', ')
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 3,
  userScalable: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Скрипт для немедленного скролла на странице favorites
              if (typeof window !== 'undefined') {
                const setScrollPosition = () => {
                  if (window.location.pathname === '/favorites') {
                    const scrollPosition = window.innerHeight * 0.66;
                    window.scrollTo(0, scrollPosition);
                  }
                };
                
                // Ждем готовности DOM
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', setScrollPosition);
                } else {
                  setScrollPosition();
                }
                
                // Дополнительные попытки после загрузки
                window.addEventListener('load', () => {
                  setTimeout(setScrollPosition, 10);
                  setTimeout(setScrollPosition, 50);
                  setTimeout(setScrollPosition, 100);
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics GA_TRACKING_ID={process.env.NEXT_PUBLIC_GA_ID} />
        <ErrorBoundary>
          <LanguageProvider>
            <div className="page-container">
              {children}
            </div>
          </LanguageProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
