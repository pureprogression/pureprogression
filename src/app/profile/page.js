"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { user: subscriptionUser, hasSubscription, subscription } = useSubscription();
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

          {/* Текущий план / Подписка */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4">
            {hasSubscription && subscription ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-green-400 font-medium text-sm flex items-center gap-2">
                      <span>✓</span>
                      <span>{language === 'en' ? 'Active Subscription' : 'Активная подписка'}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {subscription.type === 'monthly' && (language === 'en' ? 'Monthly plan' : 'Месячный план')}
                      {subscription.type === '3months' && (language === 'en' ? '3 months plan' : 'План на 3 месяца')}
                      {subscription.type === 'yearly' && (language === 'en' ? 'Yearly plan' : 'Годовой план')}
                    </div>
                  </div>
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1">
                    <span className="text-green-400 text-xs font-medium">PREMIUM</span>
                  </div>
                </div>
                {subscription.expiresAt && (
                  <div className="text-gray-400 text-xs mb-3">
                    {language === 'en' ? 'Expires:' : 'Истекает:'} {new Date(subscription.expiresAt).toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                )}
                <button
                  onClick={() => router.push('/renew-subscription')}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-400 transition-all"
                >
                  {language === 'en' ? 'Renew Subscription' : 'Продлить подписку'}
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium text-sm">{TEXTS[language].profile.freePlan}</div>
                  <div className="text-gray-400 text-xs">{TEXTS[language].profile.limitedFeatures}</div>
                </div>
                <button 
                  onClick={() => router.push('/subscribe')}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-3 rounded-lg font-medium text-sm hover:from-green-400 hover:to-emerald-400 transition-all duration-300"
                >
                  {language === 'en' ? 'Subscribe' : 'Оформить подписку'}
                </button>
              </div>
            )}
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