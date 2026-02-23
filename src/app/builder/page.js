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

export default function BuilderPage() {
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
    router.push('/auth');
    return;
  }

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
      
      // Очищаем pending workout из localStorage
      localStorage.removeItem('pending_workout');
      
      // Отслеживаем создание тренировки
      trackWorkoutCreated(workout.exercises.length);
      
      // Переходим сразу без анимации
      setIsSaving(false);
      router.push('/my-workouts');
    } catch (error) {
      console.error("Ошибка при сохранении тренировки:", error);
      setIsSaving(false);
      // Ошибка логируется в консоль
    }
  };

  const handleCancel = () => {
    router.push('/my-workouts');
  };

  // Всегда рендерим компонент, даже если загрузка еще идет
  // Это предотвращает белый экран при долгой загрузке подписки
  return (
    <>
      <Navigation currentPage="workout-builder" user={user} />
      <WorkoutBuilder 
        onSave={handleSaveWorkout}
        onCancel={handleCancel}
        isSaving={isSaving}
        initialWorkout={restoredWorkout}
      />
    </>
  );
}
