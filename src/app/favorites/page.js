"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import ExercisesSlider from "@/components/ExercisesSlider";
import ViewToggle from "@/components/ViewToggle";

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

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

  if (!user)
    return <p className="text-center mt-10">Пожалуйста, войдите в аккаунт</p>;
  if (favorites === null)
    return <p className="text-center mt-10">Загрузка...</p>;

  return (
    <>
      <Navigation currentPage="favorites" user={user} />
      <div className="pt-20">
        <div className="max-w-[1200px] mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Избранные упражнения</h2>
          <ViewToggle
            viewMode={viewMode}
            onToggle={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
          />
        </div>

        {favorites.length === 0 ? (
          <p className="text-center mt-10">У вас пока нет избранных упражнений.</p>
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
      </div>
    </>
  );
}
