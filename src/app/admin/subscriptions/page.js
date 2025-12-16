"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, isAdmin } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export default function AdminSubscriptionsPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Все пользователи для поиска
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired', 'monthly', '3months', 'yearly'
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState('monthly');
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (!isAdmin(u)) {
          router.push('/');
          return;
        }
        await loadSubscribers();
        setIsLoading(false);
      } else {
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadSubscribers = async () => {
    try {
      setIsLoading(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const subscribersList = [];
      const allUsersList = [];
      
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        const userInfo = {
          id: doc.id,
          email: userData.email || 'No email',
          displayName: userData.displayName || 'No name',
        };
        
        // Сохраняем всех пользователей для поиска
        allUsersList.push(userInfo);
        
        // Если есть подписка, обрабатываем её
        if (userData.subscription) {
          const subscription = userData.subscription;
          
          // Определяем, активна ли подписка
          let isActive = false;
          let endDate = null;
          
          if (subscription.endDate) {
            if (subscription.endDate.toDate) {
              endDate = subscription.endDate.toDate();
            } else if (subscription.endDate.seconds) {
              endDate = new Date(subscription.endDate.seconds * 1000);
            } else if (typeof subscription.endDate === 'string') {
              endDate = new Date(subscription.endDate);
            }
          }
          
          if (subscription.active && endDate) {
            isActive = endDate > new Date();
          } else if (subscription.active && !endDate) {
            isActive = true; // Если active=true, но нет даты, считаем активной
          }
          
          subscribersList.push({
            ...userInfo,
            subscription: {
              ...subscription,
              isActive,
              endDate,
              endDateFormatted: endDate ? endDate.toLocaleDateString(language === 'en' ? 'en-US' : 'ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'
            }
          });
        }
      });
      
      // Сортируем по дате окончания (активные сначала, затем истекшие)
      subscribersList.sort((a, b) => {
        if (a.subscription.isActive && !b.subscription.isActive) return -1;
        if (!a.subscription.isActive && b.subscription.isActive) return 1;
        if (a.subscription.endDate && b.subscription.endDate) {
          return b.subscription.endDate - a.subscription.endDate;
        }
        return 0;
      });
      
      setSubscribers(subscribersList);
      setAllUsers(allUsersList);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Поиск пользователей по email
  const handleSearchUser = () => {
    if (!searchEmail.trim()) {
      setSearchResults([]);
      return;
    }
    
    const searchLower = searchEmail.toLowerCase().trim();
    const results = allUsers.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchLower))
    );
    
    setSearchResults(results.slice(0, 10)); // Показываем максимум 10 результатов
  };

  const filteredSubscribers = subscribers.filter(sub => {
    // Фильтр по статусу
    if (filter === 'active' && !sub.subscription.isActive) return false;
    if (filter === 'expired' && sub.subscription.isActive) return false;
    if (filter === 'monthly' && sub.subscription.type !== 'monthly') return false;
    if (filter === '3months' && sub.subscription.type !== '3months') return false;
    if (filter === 'yearly' && sub.subscription.type !== 'yearly') return false;
    
    // Поиск по email
    if (searchEmail && !sub.email.toLowerCase().includes(searchEmail.toLowerCase())) return false;
    
    return true;
  });

  const stats = {
    total: subscribers.length,
    active: subscribers.filter(s => s.subscription.isActive).length,
    expired: subscribers.filter(s => !s.subscription.isActive).length,
    monthly: subscribers.filter(s => s.subscription.type === 'monthly').length,
    '3months': subscribers.filter(s => s.subscription.type === '3months').length,
    yearly: subscribers.filter(s => s.subscription.type === 'yearly').length
  };

  const handleExtendSubscription = async (userId, days = 30) => {
    if (!confirm(`Продлить подписку на ${days} дней?`)) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      // Получаем текущую подписку
      const subscriber = subscribers.find(s => s.id === userId);
      if (!subscriber) return;
      
      const currentEndDate = subscriber.subscription.endDate || new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);
      
      // Используем Timestamp для Firestore
      const newEndDateTimestamp = Timestamp.fromDate(newEndDate);
      
      await updateDoc(userRef, {
        'subscription.endDate': newEndDateTimestamp,
        'subscription.active': true,
        'subscription.updatedAt': serverTimestamp()
      });
      
      alert('Подписка продлена!');
      await loadSubscribers();
    } catch (error) {
      console.error('Error extending subscription:', error);
      alert('Ошибка при продлении подписки: ' + error.message);
    }
  };

  const handleCancelSubscription = async (userId) => {
    if (!confirm(language === 'en' 
      ? 'Cancel subscription? User will lose access to premium features.' 
      : 'Отменить подписку? Пользователь потеряет доступ к премиум функциям.')) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'subscription.active': false,
        'subscription.updatedAt': serverTimestamp()
      });
      
      alert(language === 'en' ? 'Subscription canceled!' : 'Подписка отменена!');
      await loadSubscribers();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert((language === 'en' ? 'Error canceling subscription: ' : 'Ошибка при отмене подписки: ') + error.message);
    }
  };

  const handleActivateSubscription = async (userId, type = 'monthly') => {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Вычисляем дату окончания подписки
      const now = new Date();
      const endDate = new Date(now);
      switch (type) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case '3months':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
        default:
          endDate.setMonth(endDate.getMonth() + 1);
      }

      const subscriptionData = {
        active: true,
        type: type,
        startDate: Timestamp.fromDate(now),
        endDate: Timestamp.fromDate(endDate),
        paymentId: `manual_${Date.now()}`,
        amount: 1,
        updatedAt: serverTimestamp()
      };

      // Проверяем, существует ли документ пользователя
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // Создаем документ пользователя
        await setDoc(userRef, {
          subscription: subscriptionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        // Обновляем подписку
        await updateDoc(userRef, {
          subscription: subscriptionData,
          updatedAt: serverTimestamp()
        });
      }
      
      alert(language === 'en' ? 'Subscription activated!' : 'Подписка активирована!');
      setShowActivateModal(false);
      setSelectedUserForSubscription(null);
      await loadSubscribers();
    } catch (error) {
      console.error('Error activating subscription:', error);
      alert((language === 'en' ? 'Error activating subscription: ' : 'Ошибка при активации подписки: ') + error.message);
    }
  };

  const handleDeactivateSubscription = async (userId) => {
    if (!confirm(language === 'en' 
      ? 'Deactivate subscription? User will lose access to premium features.' 
      : 'Деактивировать подписку? Пользователь потеряет доступ к премиум функциям.')) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'subscription.active': false,
        'subscription.updatedAt': serverTimestamp()
      });
      
      alert(language === 'en' ? 'Subscription deactivated!' : 'Подписка деактивирована!');
      await loadSubscribers();
    } catch (error) {
      console.error('Error deactivating subscription:', error);
      alert((language === 'en' ? 'Error deactivating subscription: ' : 'Ошибка при деактивации подписки: ') + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Navigation currentPage="admin" user={user} />
      <div className="min-h-screen bg-black pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Заголовок */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              {language === 'en' ? 'Subscriptions Management' : 'Управление подписками'}
            </h1>
            <p className="text-white/60">
              {language === 'en' 
                ? 'View and manage all user subscriptions'
                : 'Просмотр и управление подписками пользователей'}
            </p>
          </motion.div>

          {/* Статистика */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">{language === 'en' ? 'Total' : 'Всего'}</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-green-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
              <div className="text-green-400/60 text-sm mb-1">{language === 'en' ? 'Active' : 'Активных'}</div>
              <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            </div>
            <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
              <div className="text-red-400/60 text-sm mb-1">{language === 'en' ? 'Expired' : 'Истекших'}</div>
              <div className="text-2xl font-bold text-red-400">{stats.expired}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">{language === 'en' ? 'Monthly' : 'Месячных'}</div>
              <div className="text-2xl font-bold text-white">{stats.monthly}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">{language === 'en' ? '3 Months' : '3 месяца'}</div>
              <div className="text-2xl font-bold text-white">{stats['3months']}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-white/60 text-sm mb-1">{language === 'en' ? 'Yearly' : 'Годовых'}</div>
              <div className="text-2xl font-bold text-white">{stats.yearly}</div>
            </div>
          </motion.div>

          {/* Фильтры и поиск */}
          <motion.div
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1 flex gap-2 relative">
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Search by email or name...' : 'Поиск по email или имени...'}
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    if (e.target.value.trim()) {
                      handleSearchUser();
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchUser();
                    }
                  }}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-green-500"
                />
                <button
                  onClick={handleSearchUser}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                >
                  {language === 'en' ? 'Search' : 'Найти'}
                </button>
                
                {/* Результаты поиска */}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((user) => {
                      const hasSubscription = subscribers.find(s => s.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0"
                          onClick={() => {
                            setSelectedUserForSubscription(user);
                            setShowActivateModal(true);
                            setSearchEmail('');
                            setSearchResults([]);
                          }}
                        >
                          <div className="text-white font-medium">{user.displayName}</div>
                          <div className="text-white/60 text-sm">{user.email}</div>
                          {hasSubscription && (
                            <div className="text-xs mt-1">
                              <span className={`px-2 py-0.5 rounded ${
                                hasSubscription.subscription.isActive
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {hasSubscription.subscription.isActive 
                                  ? (language === 'en' ? 'Active' : 'Активна')
                                  : (language === 'en' ? 'Expired' : 'Истекла')}
                              </span>
                            </div>
                          )}
                          {!hasSubscription && (
                            <div className="text-xs mt-1 text-yellow-400">
                              {language === 'en' ? 'No subscription' : 'Нет подписки'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Фильтры */}
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'expired', 'monthly', '3months', 'yearly'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {f === 'all' && (language === 'en' ? 'All' : 'Все')}
                    {f === 'active' && (language === 'en' ? 'Active' : 'Активные')}
                    {f === 'expired' && (language === 'en' ? 'Expired' : 'Истекшие')}
                    {f === 'monthly' && (language === 'en' ? 'Monthly' : 'Месячные')}
                    {f === '3months' && (language === 'en' ? '3 Months' : '3 месяца')}
                    {f === 'yearly' && (language === 'en' ? 'Yearly' : 'Годовые')}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Список подписчиков */}
          <motion.div
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'User' : 'Пользователь'}</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'Type' : 'Тип'}</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'Status' : 'Статус'}</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'End Date' : 'Дата окончания'}</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'Amount' : 'Сумма'}</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'Actions' : 'Действия'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-white/60">
                        {language === 'en' ? 'No subscribers found' : 'Подписчики не найдены'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{subscriber.displayName}</div>
                          <div className="text-white/60 text-sm">{subscriber.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm">
                            {subscriber.subscription.type === 'monthly' && (language === 'en' ? 'Monthly' : 'Месячная')}
                            {subscriber.subscription.type === '3months' && (language === 'en' ? '3 Months' : '3 месяца')}
                            {subscriber.subscription.type === 'yearly' && (language === 'en' ? 'Yearly' : 'Годовая')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            subscriber.subscription.isActive
                              ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                              : 'bg-red-500/20 text-red-400 border border-red-500/50'
                          }`}>
                            {subscriber.subscription.isActive 
                              ? (language === 'en' ? 'Active' : 'Активна')
                              : (language === 'en' ? 'Expired' : 'Истекла')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-white/80">
                          {subscriber.subscription.endDateFormatted}
                        </td>
                        <td className="px-6 py-4 text-white/80">
                          {subscriber.subscription.amount} ₽
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleExtendSubscription(subscriber.id, 30)}
                              className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                              title={language === 'en' ? 'Extend 30 days' : 'Продлить на 30 дней'}
                            >
                              +30
                            </button>
                            {subscriber.subscription.isActive ? (
                              <button
                                onClick={() => handleDeactivateSubscription(subscriber.id)}
                                className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                                title={language === 'en' ? 'Deactivate subscription' : 'Деактивировать подписку'}
                              >
                                ⏸
                              </button>
                            ) : (
                              <button
                                onClick={() => handleActivateSubscription(subscriber.id, subscriber.subscription.type)}
                                className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                                title={language === 'en' ? 'Activate subscription' : 'Активировать подписку'}
                              >
                                ▶
                              </button>
                            )}
                            <button
                              onClick={() => handleCancelSubscription(subscriber.id)}
                              className="bg-red-500/20 text-red-400 px-3 py-1 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                              title={language === 'en' ? 'Cancel subscription' : 'Отменить подписку'}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Модалка для активации подписки */}
      {showActivateModal && selectedUserForSubscription && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-2xl font-bold text-white mb-4">
              {language === 'en' ? 'Activate Subscription' : 'Активировать подписку'}
            </h3>
            <div className="mb-4">
              <p className="text-white/80 mb-2">
                {language === 'en' ? 'User:' : 'Пользователь:'}
              </p>
              <p className="text-white font-medium">{selectedUserForSubscription.displayName}</p>
              <p className="text-white/60 text-sm">{selectedUserForSubscription.email}</p>
            </div>
            
            <div className="mb-6">
              <p className="text-white/80 mb-3">
                {language === 'en' ? 'Subscription Type:' : 'Тип подписки:'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {['monthly', '3months', 'yearly'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSubscriptionType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      subscriptionType === type
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {type === 'monthly' && (language === 'en' ? 'Monthly' : 'Месячная')}
                    {type === '3months' && (language === 'en' ? '3 Months' : '3 месяца')}
                    {type === 'yearly' && (language === 'en' ? 'Yearly' : 'Годовая')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowActivateModal(false);
                  setSelectedUserForSubscription(null);
                }}
                className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                {language === 'en' ? 'Cancel' : 'Отмена'}
              </button>
              <button
                onClick={() => handleActivateSubscription(selectedUserForSubscription.id, subscriptionType)}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-400 transition-colors"
              >
                {language === 'en' ? 'Activate' : 'Активировать'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

