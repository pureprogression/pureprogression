"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import WorkoutsList from "@/components/WorkoutsList";

export default function MyWorkoutsPage() {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState(null);

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
          // Сортируем на клиенте по дате создания (новые сначала)
          items.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
          });
          setWorkouts(items);
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
        <WorkoutsList workouts={workouts} user={user} />
      </div>
    </>
  );
}
