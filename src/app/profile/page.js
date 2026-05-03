"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
export default function ProfilePage() {
  const { user: subscriptionUser } = useSubscription();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    completedWorkouts: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      
      if (u) {
        await loadUserStats(u.uid);
        await loadUserData(u.uid);
      } else {
        setStats({ completedWorkouts: 0 });
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Синхронизируем user из subscription hook
  useEffect(() => {
    if (subscriptionUser) {
      setUser(subscriptionUser);
    }
  }, [subscriptionUser]);

  const loadUserData = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setDisplayName(data.displayName || '');
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error);
    }
  };

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    
    setIsSavingName(true);
    try {
      // Обновляем в Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
      
      // Обновляем в коллекции users
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        updatedAt: new Date()
      });
      
      // Обновляем локальное состояние
      setUserData({ ...userData, displayName: displayName.trim() });
      setUser({ ...user, displayName: displayName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Ошибка при сохранении имени:", error);
      alert(language === 'ru' ? 'Ошибка при сохранении имени' : 'Error saving name');
    } finally {
      setIsSavingName(false);
    }
  };

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
          
          setStats({
            completedWorkouts
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {(userData?.displayName || user.displayName || user.email)?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:border-yellow-500/50"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName || !displayName.trim()}
                        className="px-3 py-1 bg-yellow-500 text-black text-xs rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSavingName ? (language === 'ru' ? 'Сохранение...' : 'Saving...') : (language === 'ru' ? 'Сохранить' : 'Save')}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setDisplayName(userData?.displayName || user.displayName || '');
                        }}
                        className="px-3 py-1 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors"
                      >
                        {TEXTS[language].common.cancel}
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-white text-lg font-semibold">
                        {userData?.displayName || user.displayName || TEXTS[language].profile.user}
                      </h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </>
                  )}
                </div>
              </div>
              {!isEditingName && (
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setDisplayName(userData?.displayName || user.displayName || '');
                  }}
                  className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors"
                >
                  {language === 'ru' ? 'Изменить имя' : 'Edit name'}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="text-green-400 font-medium text-sm flex items-center gap-2">
              <span>✓</span>
              <span>
                {language === "en"
                  ? "Full access: save and run workouts"
                  : "Полный доступ: сохранение и выполнение тренировок"}
              </span>
            </div>
          </div>

          {/* Статистика активности временно скрыта перед релизом */}
        </div>
      </div>
    </>
  );
}