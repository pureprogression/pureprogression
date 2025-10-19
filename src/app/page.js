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
  const [filterTransitioning, setFilterTransitioning] = useState(false);
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

  // Устанавливаем начальную позицию скролла при загрузке страницы
  useEffect(() => {
    // Устанавливаем позицию скролла сразу при загрузке
    const setInitialScroll = () => {
      // Прокручиваем так, чтобы было видно часть видео и первый ряд упражнений
      const heroSection = document.querySelector('main.relative.h-screen');
      if (heroSection) {
        // Прокручиваем на 66% высоты экрана, чтобы показать часть видео и упражнения
        const scrollPosition = window.innerHeight * 0.66;
        window.scrollTo(0, scrollPosition);
      }
    };

    // Устанавливаем позицию сразу
    setInitialScroll();
    
    // Дополнительно через небольшую задержку для надежности
    const timer = setTimeout(setInitialScroll, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Анимация при изменении фильтра
  useEffect(() => {
    setFilterTransitioning(true);
    const timer = setTimeout(() => {
      setFilterTransitioning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedGroup]);

  // Фильтруем упражнения по выбранной группе
  const filteredExercises =
    selectedGroup === "All"
      ? exercises
      : exercises.filter((ex) => ex.muscleGroups.includes(selectedGroup));

  const handleExerciseClick = (exerciseIndex) => {
    console.log('[Home] Exercise clicked:', exerciseIndex);
    setInitialSlide(exerciseIndex);
    setViewMode("slider");
  };

  const handleReturnToGrid = (currentSlideIndex) => {
    setInitialSlide(currentSlideIndex);
    setViewMode("grid");
  };

  const handleSlideChange = (slideIndex) => {
    setInitialSlide(slideIndex);
  };

  // Сбрасываем initialSlide когда возвращаемся в Grid (только при переключении фильтра)
  useEffect(() => {
    if (viewMode === "grid") {
      // Не сбрасываем сразу, даем время для скролла
      const timer = setTimeout(() => {
        setInitialSlide(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  return (
    <>
      <Navigation currentPage="home" user={user} disableSwipe={viewMode === "slider"} />
      <Hero />
      <div className="relative">
        <div className="flex items-center">
          <ExercisesFilter
            exercises={exercises}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
          />
        </div>
      </div>
      <ExercisesSlider
        videos={filteredExercises}
        favorites={favorites}
        readOnly={false}
        mode="default"
        controlledViewMode={viewMode}
        onToggleViewMode={handleReturnToGrid}
        onSlideChange={handleSlideChange}
        onToggleFavorite={undefined}
        onExerciseClick={handleExerciseClick}
        initialSlideIndex={initialSlide}
        showToggle={false}
        filterTransitioning={filterTransitioning}
      />
    </>
  );
}


