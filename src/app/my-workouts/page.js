"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import WorkoutsList from "@/components/WorkoutsList";
import PremiumModal from "@/components/PremiumModal";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function MyWorkoutsPage() {
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { language } = useLanguage();

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
          console.error("Error loading workouts:", error);
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
    return (
      <>
        <Navigation currentPage="my-workouts" user={null} />
        <div className="min-h-screen bg-black flex items-center justify-center">
          <PremiumModal
            isOpen={true}
            onClose={() => window.location.href = '/'}
            onUpgrade={() => window.location.href = '/auth'}
            feature="My Workouts"
          />
        </div>
      </>
    );
  }
  
  if (workouts === null) {
    return <p className="text-center mt-10">{TEXTS[language].common.loading}</p>;
  }

  return (
    <>
      <Navigation currentPage="my-workouts" user={user} />
      <div className="max-w-[1200px] mx-auto p-4 pt-20">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{TEXTS[language].workouts.myWorkouts}</h2>
        </div>
        
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">{TEXTS[language].workouts.noWorkouts}</div>
            <div className="text-gray-500 text-sm mb-6">
              {TEXTS[language].workouts.createFirstWorkout}
            </div>
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-green-400 text-sm font-medium mb-2">
                🏋️‍♂️ {TEXTS[language].workouts.createWorkout}
              </div>
              <div className="text-gray-300 text-sm mb-4">
                {TEXTS[language].workouts.selectExercisesDescription}
              </div>
              <button 
                onClick={() => window.location.href = '/workout-builder'}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:from-green-400 hover:to-blue-400 transition-all duration-300"
              >
                {TEXTS[language].workouts.createWorkout}
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