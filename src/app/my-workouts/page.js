"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import WorkoutsList from "@/components/WorkoutsList";

export default function MyWorkoutsPage() {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        
        // Очищаем кэш при загрузке
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('workout_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Загружаем тренировки
        const workoutsQuery = query(
          collection(db, "workouts"),
          where("userId", "==", u.uid)
        );
        
        // Используем getDocs для одноразовой загрузки
        getDocs(workoutsQuery).then((snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          
          // Фильтруем тренировки с упражнениями и не удаленные
          const validWorkouts = items.filter(workout => 
            workout.exercises && 
            Array.isArray(workout.exercises) && 
            workout.exercises.length > 0 &&
            !workout._deleted // Исключаем помеченные как удаленные
          );
          
          // Сортируем по дате создания (новые сначала)
          validWorkouts.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
          
          setWorkouts(validWorkouts);
        }).catch((error) => {
          console.error("Ошибка при загрузке тренировок:", error);
          setWorkouts([]);
        });
      } else {
        setUser(null);
        setWorkouts(null);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  if (!user) {
    return <p className="text-center mt-10">Пожалуйста, войдите в аккаунт</p>;
  }
  
  if (workouts === null) {
    return <p className="text-center mt-10">Загрузка...</p>;
  }

  return (
    <>
      <Navigation currentPage="my-workouts" user={user} />
      <div className="max-w-[1200px] mx-auto p-4 pt-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Мои тренировки</h2>
        </div>
        
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">У вас пока нет тренировок</div>
            <div className="text-gray-500 text-sm mb-6">
              Создайте свою первую тренировку с помощью конструктора
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-green-400 text-sm font-medium mb-2">
                🏋️‍♂️ Создайте тренировку
              </div>
              <div className="text-gray-300 text-sm mb-4">
                Выберите упражнения и создайте свою персональную тренировку
              </div>
              <button 
                onClick={() => window.location.href = '/workout-builder'}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-400 hover:to-blue-400 transition-all duration-300"
              >
                Создать тренировку
              </button>
            </div>
          </div>
        ) : (
          <WorkoutsList workouts={workouts} user={user} />
        )}
      </div>
    </>
  );
}