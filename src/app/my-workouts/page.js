"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import WorkoutsList from "@/components/WorkoutsList";

export default function MyWorkoutsPage() {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState(null);

  // Функция для обновления списка после удаления
  const handleWorkoutDeleted = (deletedWorkoutId) => {
    console.log("🔥 Обновляем список после удаления:", deletedWorkoutId);
    setWorkouts(prevWorkouts => {
      if (!prevWorkouts) return prevWorkouts;
      return prevWorkouts.filter(workout => workout.id !== deletedWorkoutId);
    });
  };

  useEffect(() => {
    let unsubscribe = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        
        // Загружаем тренировки
        const workoutsQuery = query(
          collection(db, "workouts"),
          where("userId", "==", u.uid)
        );
        unsubscribe = onSnapshot(workoutsQuery, (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          console.log("Загруженные тренировки:", items);
          
          // Фильтруем тренировки с упражнениями
          const validWorkouts = items.filter(workout => 
            workout.exercises && 
            Array.isArray(workout.exercises) && 
            workout.exercises.length > 0
          );
          
          console.log("Валидные тренировки:", validWorkouts);
          
          // Кэшируем каждую тренировку
          validWorkouts.forEach(workout => {
            try {
              localStorage.setItem(`workout_${workout.id}`, JSON.stringify(workout));
              console.log(`Тренировка ${workout.id} сохранена в кэш`);
            } catch (error) {
              console.error(`Ошибка при кэшировании тренировки ${workout.id}:`, error);
            }
          });
          
          // Сортируем на клиенте по дате создания (новые сначала)
          validWorkouts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
          setWorkouts(validWorkouts);
        });
      } else {
        setUser(null);
        setWorkouts(null);
        if (unsubscribe) unsubscribe();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  if (!user)
    return <p className="text-center mt-10">Пожалуйста, войдите в аккаунт</p>;
  if (workouts === null)
    return <p className="text-center mt-10">Загрузка...</p>;

  return (
    <>
      <Navigation currentPage="my-workouts" user={user} />
      <div className="max-w-[1200px] mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Мои тренировки</h2>
        </div>
              <WorkoutsList workouts={workouts} user={user} onWorkoutDeleted={handleWorkoutDeleted} />
      </div>
    </>
  );
}
