"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, isAdmin } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import WorkoutsList from "@/components/WorkoutsList";
import PremiumModal from "@/components/PremiumModal";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";

export default function MyWorkoutsPage() {
  const { user, hasSubscription, isLoading: subscriptionLoading } = useSubscription();
  const [workouts, setWorkouts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const router = useRouter();
  const [showPremiumModal, setShowPremiumModal] = useState(false);

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

  // Проверка подписки при загрузке страницы (админы имеют доступ без подписки)
  useEffect(() => {
    if (!isLoading && !subscriptionLoading && user && !hasSubscription && !isAdmin(user)) {
      setShowPremiumModal(true);
    }
  }, [isLoading, subscriptionLoading, user, hasSubscription]);

  if (isLoading || subscriptionLoading) {
    return null; // Убираем загрузочный экран
  }

  if (!user) {
    return null;
  }

  // Если нет подписки и пользователь не админ, показываем модалку и блокируем доступ
  if (!hasSubscription && !isAdmin(user)) {
    return (
      <>
        <Navigation currentPage="my-workouts" user={user} />
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => {
            setShowPremiumModal(false);
            router.push('/');
          }}
          feature={language === 'en' ? 'My Workouts' : 'Мои тренировки'}
          requiresAuth={false}
        />
        <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-xl mb-4">
              {language === 'en' 
                ? 'This feature requires an active subscription'
                : 'Эта функция требует активной подписки'}
            </p>
            <button
              onClick={() => router.push('/subscribe')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-400 hover:to-emerald-400 transition-all"
            >
              {language === 'en' ? 'Subscribe Now' : 'Оформить подписку'}
            </button>
          </div>
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