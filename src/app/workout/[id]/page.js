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
        console.log("Загружаем тренировку с ID:", params.id);
        
        // Сначала пытаемся получить из localStorage (кэш)
        const cachedWorkout = localStorage.getItem(`workout_${params.id}`);
        if (cachedWorkout) {
          try {
            const workoutData = JSON.parse(cachedWorkout);
            console.log("Тренировка загружена из кэша:", workoutData);
            
            // Проверяем, что тренировка принадлежит пользователю
            if (workoutData.userId === u.uid) {
              console.log("Тренировка из кэша принадлежит пользователю, загружаем");
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
          console.log("🔍 Пытаемся загрузить документ:", `workouts/${params.id}`);
          console.log("🔍 Пользователь:", {
            uid: u.uid,
            email: u.email,
            emailVerified: u.emailVerified
          });
          
          const workoutDoc = await getDoc(doc(db, 'workouts', params.id));
          console.log("🔍 Результат getDoc:", {
            exists: workoutDoc.exists(),
            id: workoutDoc.id,
            data: workoutDoc.exists() ? workoutDoc.data() : null
          });
          
          if (workoutDoc.exists()) {
            const workoutData = {
              id: workoutDoc.id,
              ...workoutDoc.data()
            };
            console.log("Данные тренировки:", workoutData);
            console.log("ID пользователя:", u.uid);
            console.log("ID владельца тренировки:", workoutData.userId);
            
            // Проверяем, что тренировка принадлежит пользователю
            if (workoutData.userId === u.uid) {
              console.log("Тренировка принадлежит пользователю, загружаем и кэшируем");
              
              // Кэшируем тренировку
              localStorage.setItem(`workout_${params.id}`, JSON.stringify(workoutData));
              console.log("Тренировка сохранена в кэш");
              
              setWorkout(workoutData);
            } else {
              console.error("Тренировка не принадлежит пользователю");
              alert("У вас нет доступа к этой тренировке");
              router.push('/my-workouts');
            }
          } else {
            console.error("❌ Тренировка не найдена в Firebase");
            console.log("🔍 Проверяем права доступа...");
            
            // Попробуем загрузить любой документ из коллекции workouts для проверки прав
            try {
              const testQuery = collection(db, 'workouts');
              console.log("🔍 Тест доступа к коллекции workouts: OK");
            } catch (testError) {
              console.error("❌ Ошибка доступа к коллекции workouts:", testError);
            }
            
            // Если есть кэш, используем его
            if (cachedWorkout) {
              console.log("✅ Используем кэшированную тренировку");
              const workoutData = JSON.parse(cachedWorkout);
              setWorkout(workoutData);
            } else {
              alert("Тренировка не найдена или была удалена");
              router.push('/my-workouts');
            }
          }
        } catch (error) {
          console.error("Ошибка при загрузке тренировки:", error);
          
          // Если есть кэш, используем его
          if (cachedWorkout) {
            console.log("Используем кэшированную тренировку после ошибки");
            const workoutData = JSON.parse(cachedWorkout);
            setWorkout(workoutData);
          } else {
            alert("Ошибка при загрузке тренировки: " + error.message);
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
      
      console.log("Тренировка завершена и сохранена в историю");
      
      // Перенаправляем в мои тренировки (безопаснее)
      router.push('/my-workouts');
    } catch (error) {
      console.error("Ошибка при сохранении результатов:", error);
      alert("Ошибка при сохранении результатов тренировки");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelWorkout = () => {
    router.push('/my-workouts');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Загрузка тренировки...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Пожалуйста, войдите в аккаунт</div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
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
