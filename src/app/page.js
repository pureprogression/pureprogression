"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { auth, db, isAdmin } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackWorkoutCreated } from "@/lib/analytics";
import { useSubscription } from "@/hooks/useSubscription";

export default function Home() {
  const router = useRouter();
  const { user, hasSubscription, isLoading: subscriptionLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [restoredWorkout, setRestoredWorkout] = useState(null);

  useEffect(() => {
    setIsLoading(false);
    
    // Восстанавливаем тренировку из localStorage при загрузке
    if (typeof window !== 'undefined') {
      const pendingWorkoutStr = localStorage.getItem('pending_workout');
      if (pendingWorkoutStr) {
        try {
          const pendingWorkout = JSON.parse(pendingWorkoutStr);
          setRestoredWorkout(pendingWorkout);
        } catch (error) {
          console.error('Error parsing pending workout:', error);
        }
      }
    }
  }, []);

  const handleSaveWorkout = async (workout) => {
    // Если пользователь не авторизован - редирект на авторизацию
    if (!user) {
      // Сохраняем тренировку в localStorage перед редиректом
      const workoutToSave = {
        name: workout.name,
        description: workout.description || "",
        exercises: workout.exercises,
        estimatedDuration: workout.estimatedDuration,
        savedAt: Date.now()
      };
      localStorage.setItem('pending_workout', JSON.stringify(workoutToSave));
      router.push('/auth?redirect=/subscribe');
      return;
    }

    // Все авторизованные пользователи могут сохранять тренировки
    setIsSaving(true);
    
    try {
      const workoutData = {
        name: workout.name,
        description: workout.description || "",
        exercises: workout.exercises,
        userId: user.uid,
        createdAt: serverTimestamp(),
        estimatedDuration: workout.estimatedDuration
      };

      await addDoc(collection(db, 'workouts'), workoutData);
      trackWorkoutCreated(workout.exercises.length);
      localStorage.removeItem('pending_workout'); // Удаляем после успешного сохранения
      router.push('/my-workouts');
    } catch (error) {
      console.error("Ошибка при сохранении тренировки:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Если есть авторизованный пользователь - на страницу тренировок, иначе просто закрываем
    if (user) {
      router.push('/my-workouts');
    }
  };

  if (isLoading || subscriptionLoading) {
    return null;
  }

  return (
    <>
      <Navigation currentPage="home" user={user} />
      <WorkoutBuilder 
        onSave={handleSaveWorkout}
        onCancel={handleCancel}
        isSaving={isSaving}
        initialWorkout={restoredWorkout}
      />
    </>
  );
}
