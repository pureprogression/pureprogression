"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import WorkoutsList from "@/components/WorkoutsList";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { trackWorkoutCreated } from "@/lib/analytics";
import { MAX_WORKOUT_EXERCISES } from "@/constants/workoutLimits";

export default function MyWorkoutsPage() {
  const { user, hasSubscription, isLoading: subscriptionLoading } = useSubscription();
  const [workouts, setWorkouts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const router = useRouter();
  // Закрываем меню Navigation при загрузке страницы
  useEffect(() => {
    const cleanup = () => {
      // Ищем все fixed элементы с высоким z-index и backdrop-blur
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        const backdropFilter = style.backdropFilter || style.webkitBackdropFilter || '';
        
        // Если это fixed элемент с z-index >= 9998 и backdrop-blur
        if (
          style.position === 'fixed' && 
          zIndex >= 9998 &&
          backdropFilter !== 'none' &&
          backdropFilter !== ''
        ) {
          const rect = el.getBoundingClientRect();
          // Проверяем, что элемент занимает весь экран (overlay)
          if (rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9) {
            el.remove();
          }
        }
      });
    };
    
    // Выполняем сразу и с задержками для надежности
    cleanup();
    const timer1 = setTimeout(cleanup, 10);
    const timer2 = setTimeout(cleanup, 50);
    const timer3 = setTimeout(cleanup, 100);
    const timer4 = setTimeout(cleanup, 200);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

  // Сохраняем тренировку из localStorage если она есть
  useEffect(() => {
    if (!user || subscriptionLoading) return;

    const pendingWorkoutStr = typeof window !== 'undefined' && localStorage.getItem('pending_workout');
    if (pendingWorkoutStr && hasSubscription) {
      const savePendingWorkout = async () => {
        try {
          const pendingWorkout = JSON.parse(pendingWorkoutStr);
          console.log('[My Workouts] Saving pending workout:', pendingWorkout);

          const exercises = Array.isArray(pendingWorkout.exercises)
            ? pendingWorkout.exercises.slice(0, MAX_WORKOUT_EXERCISES)
            : [];

          const workoutData = {
            name: pendingWorkout.name,
            description: pendingWorkout.description || "",
            exercises,
            userId: user.uid,
            createdAt: serverTimestamp(),
            estimatedDuration:
              typeof pendingWorkout.estimatedDuration === "number"
                ? pendingWorkout.estimatedDuration
                : exercises.length * 3,
          };

          await addDoc(collection(db, 'workouts'), workoutData);
          trackWorkoutCreated(exercises.length);
          
          // Удаляем из localStorage после успешного сохранения
          localStorage.removeItem('pending_workout');
          console.log('✅ [My Workouts] Workout saved successfully!');
          
          // Перезагружаем список тренировок
          window.location.reload();
        } catch (error) {
          console.error('[My Workouts] Error saving pending workout:', error);
        }
      };

      savePendingWorkout();
    }
  }, [user, hasSubscription, subscriptionLoading]);

  useEffect(() => {
    if (user) {
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
          where("userId", "==", user.uid)
        );
        
        // Используем getDocs для одноразовой загрузки
        getDocs(workoutsQuery).then((snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          
          // Фильтруем тренировки с упражнениями
          const validWorkouts = items.filter(workout => 
            workout.exercises && 
            Array.isArray(workout.exercises) && 
            workout.exercises.length > 0
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
      setWorkouts(null);
    }
    setIsLoading(false);
  }, [user]);

  // Редирект для неавторизованных пользователей
  useEffect(() => {
    if (!isLoading && !subscriptionLoading && !user) {
      router.push('/auth');
    }
  }, [isLoading, subscriptionLoading, user, router]);

  if (isLoading || subscriptionLoading) {
    return null; // Убираем загрузочный экран
  }

  if (!user) {
    return null;
  }

  // Все авторизованные пользователи могут видеть список тренировок
  // Но открывать их могут только с подпиской (проверка будет при клике)
  
  if (workouts === null) {
    return <p className="text-center mt-10">{TEXTS[language].common.loading}</p>;
  }

  return (
    <>
      <Navigation currentPage="my-workouts" user={user} />
      <div className="min-h-screen bg-black">
        <div className="max-w-[1200px] mx-auto p-4 pt-20">
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
                onClick={() => { window.location.href = "/"; }}
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
      </div>
    </>
  );
}
