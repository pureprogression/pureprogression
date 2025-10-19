"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import WorkoutExecution from "@/components/WorkoutExecution";

export default function WorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      
      if (u && params.id) {
        // Сначала пытаемся получить из localStorage (кэш)
        const cachedWorkout = localStorage.getItem(`workout_${params.id}`);
        if (cachedWorkout) {
          try {
            const workoutData = JSON.parse(cachedWorkout);
            
            // Проверяем, что тренировка принадлежит пользователю
            if (workoutData.userId === u.uid) {
              setWorkout(workoutData);
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error("Ошибка при парсинге кэша:", error);
          }
        }
        
        try {
          // Загружаем тренировку из Firebase
          const workoutDoc = await getDoc(doc(db, 'workouts', params.id));
          
          if (workoutDoc.exists()) {
            const workoutData = {
              id: workoutDoc.id,
              ...workoutDoc.data()
            };
            
            // Проверяем, что тренировка принадлежит пользователю
            if (workoutData.userId === u.uid) {
              // Кэшируем тренировку
              localStorage.setItem(`workout_${params.id}`, JSON.stringify(workoutData));
              
              setWorkout(workoutData);
            } else {
              console.error("Тренировка не принадлежит пользователю");
              console.log("Нет доступа к тренировке");
              router.push('/my-workouts');
            }
          } else {
            // Если есть кэш, используем его
            if (cachedWorkout) {
              const workoutData = JSON.parse(cachedWorkout);
              setWorkout(workoutData);
            } else {
              console.log("Тренировка не найдена");
              router.push('/my-workouts');
            }
          }
        } catch (error) {
          console.error("Ошибка при загрузке тренировки:", error);
          
          // Если есть кэш, используем его
          if (cachedWorkout) {
            const workoutData = JSON.parse(cachedWorkout);
            setWorkout(workoutData);
          } else {
            console.log("Ошибка при загрузке тренировки");
            router.push('/my-workouts');
          }
        }
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [params.id, router]);

  const handleCompleteWorkout = async (workoutResults) => {
    if (!user || !workout) return;
    
    setIsSaving(true);
    
    try {
      // Сохраняем результаты тренировки в историю
      const historyData = {
        userId: user.uid,
        userEmail: user.email,
        workoutId: workout.id,
        workoutName: workout.name,
        completedAt: serverTimestamp(),
        exercises: workoutResults.exercises,
      };

      await addDoc(collection(db, 'workoutHistory'), historyData);
      
      // Перенаправляем в мои тренировки (безопаснее)
      router.push('/my-workouts');
    } catch (error) {
      console.error("Ошибка при сохранении результатов:", error);
      console.log("Ошибка при сохранении результатов");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelWorkout = () => {
    router.push('/my-workouts');
  };

  if (isLoading) {
    return null; // Убираем загрузочный экран
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Пожалуйста, войдите в аккаунт</div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Тренировка не найдена</div>
      </div>
    );
  }

  return (
    <>
      <Navigation currentPage="workout-execution" user={user} />
      <WorkoutExecution 
        workout={workout}
        onComplete={handleCompleteWorkout}
        onCancel={handleCancelWorkout}
        isSaving={isSaving}
      />
    </>
  );
}
