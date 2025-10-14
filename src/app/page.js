"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Hero from "@/components/Hero";
import Navigation from "@/components/Navigation";
import ExercisesSlider from "@/components/ExercisesSlider";
import ExercisesFilter from "@/components/ExercisesFilter";
import ViewToggle from "@/components/ViewToggle";
import { exercises } from "@/data/exercises";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function Home() {
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [initialSlide, setInitialSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeFavorites = null;
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      setUser(u || null);
      if (u) {
        const qRef = query(
          collection(db, "favorites"),
          where("userId", "==", u.uid)
        );
        unsubscribeFavorites = onSnapshot(qRef, (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            exerciseId: d.data().exerciseId,
            title: d.data().title,
            video: d.data().video,
          }));
          setFavorites(items);
        });
      } else {
        setFavorites([]);
        if (unsubscribeFavorites) unsubscribeFavorites();
      }
    });

    return () => {
      if (unsubscribeFavorites) unsubscribeFavorites();
      unsubscribeAuth();
    };
  }, []);


  // Фильтруем упражнения по выбранной группе
  const filteredExercises =
    selectedGroup === "All"
      ? exercises
      : exercises.filter((ex) => ex.muscleGroups.includes(selectedGroup));

  const handleExerciseClick = (exerciseIndex) => {
    setInitialSlide(exerciseIndex);
    setViewMode("slider");
  };

  // Сбрасываем initialSlide когда возвращаемся в Grid
  useEffect(() => {
    if (viewMode === "grid") {
      setInitialSlide(0);
    }
  }, [viewMode]);

  return (
    <>
      <Navigation currentPage="home" user={user} />
      <Hero />
      <div className="relative">
        <div className="flex items-center justify-between">
          <ExercisesFilter
            exercises={exercises}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
          />
          <ViewToggle
            viewMode={viewMode}
            onToggle={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
            className="mr-4 flex-shrink-0"
          />
        </div>
      </div>
      <ExercisesSlider
        videos={filteredExercises}
        favorites={favorites}
        readOnly={false}
        mode="default"
        controlledViewMode={viewMode}
        onToggleViewMode={() => setViewMode(viewMode === "slider" ? "grid" : "slider")}
        onToggleFavorite={undefined}
        onExerciseClick={handleExerciseClick}
        initialSlideIndex={initialSlide}
        showToggle={false}
      />
    </>
  );
}


