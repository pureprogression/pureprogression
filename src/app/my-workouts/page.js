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
      <div className="min-h-screen bg-app">
        <div className="max-w-[1200px] mx-auto p-4 pt-20">
        {workouts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-white/70 text-lg mb-2">{TEXTS[language].workouts.noWorkouts}</p>
            <p className="text-white/40 text-sm mb-8 max-w-sm mx-auto">
              {TEXTS[language].workouts.createFirstWorkout}
            </p>
            <div className="rounded-2xl border border-brand-500/25 bg-brand-500/5 p-6 max-w-md mx-auto">
              <p className="text-brand-400 text-sm font-semibold mb-2">
                {TEXTS[language].workouts.createWorkout}
              </p>
              <p className="text-white/50 text-sm mb-5">
                {TEXTS[language].workouts.selectExercisesDescription}
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full py-3 rounded-xl bg-brand-500 text-black font-bold hover:bg-brand-400 transition-colors"
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
