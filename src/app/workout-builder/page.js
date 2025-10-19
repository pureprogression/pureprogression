"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import PremiumModal from "@/components/PremiumModal";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackWorkoutCreated } from "@/lib/analytics";

export default function WorkoutBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveWorkout = async (workout) => {
    setIsSaving(true);
    
    try {
      // Простая структура как у тестовой тренировки
      const workoutData = {
        name: workout.name,
        description: workout.description || "",
        exercises: workout.exercises,
        userId: user.uid,
        createdAt: serverTimestamp(),
        estimatedDuration: workout.estimatedDuration
      };

      // Сохраняем в коллекцию 'workouts' в Firebase
      await addDoc(collection(db, 'workouts'), workoutData);
      
      // Отслеживаем создание тренировки
      trackWorkoutCreated(workout.exercises.length);
      
      // Перенаправляем на страницу с тренировками
      router.push('/my-workouts');
    } catch (error) {
      console.error("Ошибка при сохранении тренировки:", error);
      // Ошибка логируется в консоль
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/my-workouts');
  };

  if (isLoading) {
    return null; // Убираем загрузочный экран
  }

  if (!user) {
    return (
      <>
        <Navigation currentPage="workout-builder" user={null} />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <PremiumModal
            isOpen={true}
            onClose={() => window.location.href = '/'}
            onUpgrade={() => window.location.href = '/auth'}
            feature="Workout Builder"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation currentPage="workout-builder" user={user} />
      <WorkoutBuilder 
        onSave={handleSaveWorkout}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </>
  );
}
