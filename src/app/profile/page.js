"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    completedWorkouts: 0,
    totalExercises: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      
      if (u) {
        await loadUserStats(u.uid);
      } else {
        setStats({ completedWorkouts: 0, totalExercises: 0 });
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadUserStats = async (userId) => {
    try {
      setIsLoading(true);
      
      // Загружаем только историю тренировок (устойчивые данные)
      const historyQuery = query(
        collection(db, "workoutHistory"),
        where("userId", "==", userId)
      );
      const historySnapshot = await getDocs(historyQuery);
      
      // Подсчитываем статистику из истории
      const completedWorkouts = historySnapshot.docs.length;
      
      // Подсчитываем общее количество упражнений из выполненных тренировок
      let totalExercises = 0;
      historySnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.exercises && Array.isArray(data.exercises)) {
          totalExercises += data.exercises.length;
        }
      });
      
      setStats({
        completedWorkouts,
        totalExercises
      });
      
    } catch (error) {
      console.error("Ошибка при загрузке статистики:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user)
    return <p className="text-center mt-10">Please sign in to your account</p>;

  return (
    <>
      <Navigation currentPage="profile" user={user} />
      <div className="pt-20">
        <div className="max-w-[1200px] mx-auto p-4">
          <h2 className="text-2xl font-bold mb-6 text-white">{TEXTS[language].profile.title}</h2>
          
          {/* Информация о пользователе */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold">
                  {user.displayName || TEXTS[language].profile.user}
                </h3>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Текущий план */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium text-sm">{TEXTS[language].profile.freePlan}</div>
                <div className="text-gray-400 text-xs">{TEXTS[language].profile.limitedFeatures}</div>
              </div>
              <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 px-3 rounded-lg font-medium text-sm hover:from-yellow-400 hover:to-orange-400 transition-all duration-300">
                {TEXTS[language].profile.upgrade}
              </button>
            </div>
          </div>

          {/* Статистика активности */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-white text-sm font-semibold mb-3">{TEXTS[language].profile.activity}</h3>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="animate-pulse">
                      <div className="h-6 bg-white/20 rounded mb-2"></div>
                      <div className="h-3 bg-white/10 rounded w-3/4 mx-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-white text-lg font-bold">{stats.completedWorkouts}</div>
                  <div className="text-gray-400 text-xs">{TEXTS[language].profile.completedWorkouts}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <div className="text-white text-lg font-bold">{stats.totalExercises}</div>
                  <div className="text-gray-400 text-xs">{TEXTS[language].profile.completedExercises}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}