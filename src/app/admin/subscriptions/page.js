"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, isAdmin } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export default function AdminSubscriptionsPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired', 'monthly', '3months', 'yearly'
  const [searchEmail, setSearchEmail] = useState('');
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
      
      const allUsers = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
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
          
          allUsers.push({
            id: doc.id,
            email: userData.email || 'No email',
            displayName: userData.displayName || 'No name',
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
      allUsers.sort((a, b) => {
        if (a.subscription.isActive && !b.subscription.isActive) return -1;
        if (!a.subscription.isActive && b.subscription.isActive) return 1;
        if (a.subscription.endDate && b.subscription.endDate) {
          return b.subscription.endDate - a.subscription.endDate;
        }
        return 0;
      });
      
      setSubscribers(allUsers);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setIsLoading(false);
    }
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
    if (!confirm('Отменить подписку? Пользователь потеряет доступ к премиум функциям.')) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'subscription.active': false,
        'subscription.updatedAt': serverTimestamp()
      });
      
      alert('Подписка отменена!');
      await loadSubscribers();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Ошибка при отмене подписки: ' + error.message);
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
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Поиск */}
              <input
                type="text"
                placeholder={language === 'en' ? 'Search by email...' : 'Поиск по email...'}
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-green-500"
              />
              
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
    </>
  );
}

