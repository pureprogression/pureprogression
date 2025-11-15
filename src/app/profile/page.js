"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ProfilePage() {
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
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="animate-pulse">
                        <div className="h-6 bg-white/20 rounded mb-2"></div>
                        <div className="h-3 bg-white/10 rounded w-3/4 mx-auto"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-white/10 rounded-lg p-3 text-center">
                      <div className="text-white text-lg font-bold">{stats.completedWorkouts}</div>
                      <div className="text-gray-400 text-xs">{TEXTS[language].profile.completedWorkouts}</div>
                    </div>
                  </div>
                )}
          </div>
        </div>
      </div>
    </>
  );
}