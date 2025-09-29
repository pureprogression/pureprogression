"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import ExercisesSlider from "@/components/ExercisesSlider";
import ViewToggle from "@/components/ViewToggle";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState(null);
  const [viewMode, setViewMode] = useState("slider");

  useEffect(() => {
    let unsubscribeFavorites = null;
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        const qRef = query(
          collection(db, "favorites"),
          where("userId", "==", u.uid)
        );
        unsubscribeFavorites = onSnapshot(qRef, (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            // id: идентификатор документа favorites (используется для удаления)
            id: d.id,
            // exerciseId: исходный id упражнения (нужен для сравнения/рендера)
            exerciseId: d.data().exerciseId,
            title: d.data().title,
            video: d.data().video,
          }));
          setFavorites(items);
        });
      } else {
        setUser(null);
        setFavorites(null);
        if (unsubscribeFavorites) unsubscribeFavorites();
      }
    });

    return () => {
      if (unsubscribeFavorites) unsubscribeFavorites();
      unsubscribeAuth();
    };
  }, []);

  if (!user)
    return <p className="text-center mt-10">Пожалуйста, войдите в аккаунт</p>;
  if (favorites === null)
    return <p className="text-center mt-10">Загрузка избранного...</p>;
  if (favorites.length === 0)
    return <p className="text-center mt-10">У вас пока нет избранных упражнений.</p>;

  return (
    <>
      <Navigation currentPage="profile" user={user} />
      <div className="max-w-[1200px] mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Избранные упражнения</h2>
          <ViewToggle
            viewMode={viewMode}
            onToggle={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
          />
        </div>

      <ExercisesSlider
        videos={favorites}
        favorites={favorites}
        readOnly={false}
        mode="favorites-page"
        controlledViewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
        showToggle={false}
      />
      </div>
    </>
  );
}
