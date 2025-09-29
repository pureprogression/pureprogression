"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { auth } from "@/lib/firebase";

export default function WorkoutBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
      
      // Если пользователь не авторизован, перенаправляем на главную
      if (!user) {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSaveWorkout = (workout) => {
    // TODO: Сохранить тренировку в Firebase
    console.log("Сохранение тренировки:", workout);
    
    // Пока просто показываем уведомление
    alert(`Тренировка "${workout.name}" сохранена!`);
    
    // Перенаправляем в профиль или меню
    router.push('/profile');
  };

  const handleCancel = () => {
    router.push('/profile');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Будет перенаправление
  }

  return (
    <>
      <Navigation currentPage="workout-builder" user={user} />
      <WorkoutBuilder 
        onSave={handleSaveWorkout}
        onCancel={handleCancel}
      />
    </>
  );
}
