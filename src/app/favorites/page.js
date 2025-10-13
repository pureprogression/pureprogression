"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import ExercisesSlider from "@/components/ExercisesSlider";
import ViewToggle from "@/components/ViewToggle";
import PremiumModal from "@/components/PremiumModal";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const { language } = useLanguage();

  useEffect(() => {
    let unsubscribe = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        
        // Загружаем избранные упражнения
        const favoritesQuery = query(
          collection(db, "favorites"),
          where("userId", "==", u.uid)
        );
        unsubscribe = onSnapshot(favoritesQuery, (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            exerciseId: d.data().exerciseId,
            title: d.data().title,
            video: d.data().video,
          }));
          setFavorites(items);
        });
      } else {
        setUser(null);
        setFavorites(null);
        if (unsubscribe) unsubscribe();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  if (!user) {
    return (
      <>
        <Navigation currentPage="favorites" user={null} />
        <div className="min-h-screen bg-black pt-20">
          <div className="max-w-[1200px] mx-auto p-4">
            <h2 className="text-2xl font-bold text-white mb-6">{TEXTS[language].favorites.title}</h2>
            
            {/* Сообщение для неавторизованных пользователей */}
            <div className="text-center py-12">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-8 max-w-md mx-auto">
                <div className="text-4xl mb-4">❤️</div>
                <div className="text-yellow-400 text-lg font-medium mb-3">
                  {TEXTS[language].favorites.loginRequired || "Sign in to save favorites"}
                </div>
                <div className="text-gray-300 text-sm mb-6">
                  {TEXTS[language].favorites.loginDescription || "Create an account to save your favorite exercises and access them anytime"}
                </div>
                <button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-3 px-6 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-400 transition-all duration-300 shadow-lg"
                >
                  {TEXTS[language].auth.signIn || "Sign In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  if (favorites === null)
    return <p className="text-center mt-10">{TEXTS[language].common.loading}</p>;

  return (
    <>
      <Navigation currentPage="favorites" user={user} />
      <div className="pt-20">
        {/* Заголовок и переключатель в ограниченном контейнере */}
        <div className="max-w-[1200px] mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{TEXTS[language].favorites.title}</h2>
            <ViewToggle
              viewMode={viewMode}
              onToggle={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
            />
          </div>
        </div>

        {/* Слайдер упражнений на полную ширину как на главной странице */}
        {favorites.length === 0 ? (
          <div className="max-w-[1200px] mx-auto p-4">
            <p className="text-center mt-10">{TEXTS[language].favorites.noFavorites}</p>
          </div>
        ) : (
          <ExercisesSlider
            videos={favorites}
            favorites={favorites}
            readOnly={false}
            mode="favorites-page"
            controlledViewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
            showToggle={false}
          />
        )}
      </div>
    </>
  );
}
