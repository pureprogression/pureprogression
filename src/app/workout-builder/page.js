"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function WorkoutBuilderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveWorkout = async (workout) => {
    setIsSaving(true);
    
    try {
      // Добавляем информацию о пользователе и время создания
      const workoutData = {
        ...workout,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Сохраняем в коллекцию 'workouts' в Firebase
      const docRef = await addDoc(collection(db, 'workouts'), workoutData);
      
      console.log("Тренировка сохранена с ID:", docRef.id);
      
      // Показываем уведомление об успехе
      alert(`Тренировка "${workout.name}" успешно сохранена!`);
      
      // Перенаправляем в профиль
      router.push('/profile');
    } catch (error) {
      console.error("Ошибка при сохранении тренировки:", error);
      alert("Ошибка при сохранении тренировки. Попробуйте еще раз.");
    } finally {
      setIsSaving(false);
    }
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
        isSaving={isSaving}
      />
    </>
  );
}
