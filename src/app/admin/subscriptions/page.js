"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db, isAdmin } from "@/lib/firebase";
import { collection, getDocs, query, where, limit, doc, updateDoc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
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
      console.log('[Admin] Loading subscribers...');
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const subscribersList = [];
      const allUsersList = [];
      
      console.log('[Admin] Total users found:', querySnapshot.size);
      
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
          
          // Логируем для отладки
          if (userData.email === 'massimpolunin@gmail.com' || doc.id === 'Hqq91BOgI9gOo13U573OfxEw4mV2' || doc.id === 'sGmrEy7q8gQyQSUjVRikcANrAC82') {
            console.log('[Admin] Found subscription for user:', {
              userId: doc.id,
              email: userData.email,
              subscriptionType: subscription.type,
              subscription: subscription,
              isActive: isActive,
              endDate: endDate,
              endDateFormatted: endDate ? endDate.toLocaleDateString('ru-RU') : 'N/A'
            });
          }
          
          // Вычисляем количество дней до окончания для отладки
          let daysUntilExpiry = null;
          if (endDate) {
            const now = new Date();
            daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
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
              }) : 'N/A',
              daysUntilExpiry: daysUntilExpiry
            }
          });
          
          // Логируем для пользователя с проблемной датой
          if (doc.id === 'sGmrEy7q8gQyQSUjVRikcANrAC82') {
            console.log('[Admin] ===== User sGmrEy7q8gQyQSUjVRikcANrAC82 subscription details =====');
            console.log('[Admin] Type:', subscription.type);
            console.log('[Admin] Active:', subscription.active);
            console.log('[Admin] Amount:', subscription.amount);
            console.log('[Admin] Payment ID:', subscription.paymentId);
            console.log('[Admin] Start Date (raw):', subscription.startDate);
            console.log('[Admin] End Date (raw):', subscription.endDate);
            console.log('[Admin] End Date (formatted):', endDate ? endDate.toLocaleDateString('ru-RU') : 'N/A');
            console.log('[Admin] Days until expiry:', daysUntilExpiry);
            console.log('[Admin] Full subscription object:', JSON.stringify(subscription, null, 2));
            console.log('[Admin] ================================================================');
          }
        }
      });
      
      // Группируем по email и помечаем дубликаты
      const emailGroups = new Map();
      subscribersList.forEach(sub => {
        const email = sub.email.toLowerCase();
        if (!emailGroups.has(email)) {
          emailGroups.set(email, []);
        }
        emailGroups.get(email).push(sub);
      });
      
      // Помечаем дубликаты (если у одного email несколько документов)
      subscribersList.forEach(sub => {
        const email = sub.email.toLowerCase();
        const group = emailGroups.get(email);
        if (group && group.length > 1) {
          sub.hasDuplicates = true;
          sub.duplicateCount = group.length;
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
      
      console.log('[Admin] Subscribers loaded:', {
        total: subscribersList.length,
        active: subscribersList.filter(s => s.subscription.isActive).length,
        expired: subscribersList.filter(s => !s.subscription.isActive).length
      });
      
      // Принудительно обновляем состояние
      setSubscribers([...subscribersList]); // Создаем новый массив для принудительного обновления
      setAllUsers([...allUsersList]);
      
      // Логируем для отладки
      const activeSubs = subscribersList.filter(s => s.subscription.isActive);
      console.log('[Admin] Active subscriptions:', activeSubs.map(s => ({
        id: s.id,
        email: s.email,
        type: s.subscription.type,
        endDate: s.subscription.endDateFormatted
      })));
    } catch (error) {
      console.error('[Admin] Error loading subscribers:', error);
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
    if (!confirm(language === 'en' 
      ? `Extend subscription by ${days} days?` 
      : `Продлить подписку на ${days} дней?`)) return;
    
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
      
      alert(language === 'en' ? 'Subscription extended!' : 'Подписка продлена!');
      await loadSubscribers();
    } catch (error) {
      console.error('Error extending subscription:', error);
      alert((language === 'en' ? 'Error extending subscription: ' : 'Ошибка при продлении подписки: ') + error.message);
    }
  };

  const handleMergeDuplicateAccounts = async (email) => {
    if (!confirm(language === 'en' 
      ? `Merge all accounts with email ${email} into one? This will keep the most recent active subscription and remove duplicates.`
      : `Объединить все аккаунты с email ${email} в один? Будет сохранена самая свежая активная подписка, дубликаты будут удалены.`)) return;
    
    try {
      setIsLoading(true);
      
      // Находим все документы с таким email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert(language === 'en' ? 'No users found with this email' : 'Пользователи с таким email не найдены');
        return;
      }
      
      console.log(`[Admin] Found ${querySnapshot.size} accounts with email ${email}`);
      
      // Находим документ с самой свежей активной подпиской
      let mainDoc = null;
      let mainDocData = null;
      let latestEndDate = null;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.subscription && data.subscription.active) {
          let endDate = null;
          if (data.subscription.endDate?.toDate) {
            endDate = data.subscription.endDate.toDate();
          } else if (data.subscription.endDate?.seconds) {
            endDate = new Date(data.subscription.endDate.seconds * 1000);
          }
          
          if (endDate && (!latestEndDate || endDate > latestEndDate)) {
            latestEndDate = endDate;
            mainDoc = doc;
            mainDocData = data;
          }
        }
      });
      
      // Если нет активной подписки, берем самый последний документ
      if (!mainDoc) {
        mainDoc = querySnapshot.docs[0];
        mainDocData = mainDoc.data();
        console.log('[Admin] No active subscription found, using first document');
      }
      
      const mainUserId = mainDoc.id;
      console.log(`[Admin] Main account to keep: ${mainUserId}`);
      
      // Объединяем данные: берем подписку из главного документа, но сохраняем все остальные данные
      const mergedData = {
        email: email,
        displayName: mainDocData.displayName || 'No name',
        subscription: mainDocData.subscription,
        updatedAt: serverTimestamp()
      };
      
      // Если есть createdAt в главном документе, сохраняем его
      if (mainDocData.createdAt) {
        mergedData.createdAt = mainDocData.createdAt;
      }
      
      // Обновляем главный документ
      await updateDoc(doc(db, 'users', mainUserId), mergedData);
      console.log(`[Admin] Updated main account ${mainUserId}`);
      
      // Удаляем все остальные документы
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== mainUserId) {
          console.log(`[Admin] Deleting duplicate account ${doc.id}`);
          deletePromises.push(deleteDoc(doc.ref));
        }
      });
      
      await Promise.all(deletePromises);
      console.log(`[Admin] Deleted ${deletePromises.length} duplicate accounts`);
      
      alert(language === 'en' 
        ? `Successfully merged! Kept account ${mainUserId}, removed ${deletePromises.length} duplicates.`
        : `Успешно объединено! Сохранен аккаунт ${mainUserId}, удалено ${deletePromises.length} дубликатов.`);
      
      await loadSubscribers();
    } catch (error) {
      console.error('[Admin] Error merging accounts:', error);
      alert((language === 'en' ? 'Error merging accounts: ' : 'Ошибка при объединении аккаунтов: ') + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFixSubscriptionDate = async (userId) => {
    if (!confirm(language === 'en' 
      ? 'Fix subscription end date to 1 month from now? This will correct the subscription period.' 
      : 'Исправить дату окончания подписки на 1 месяц с сегодняшнего дня? Это исправит период подписки.')) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists() || !userDoc.data().subscription) {
        alert(language === 'en' ? 'User or subscription not found' : 'Пользователь или подписка не найдены');
        return;
      }
      
      const userData = userDoc.data();
      const subscription = userData.subscription;
      
      // Вычисляем правильную дату окончания: текущая дата + период подписки
      const now = new Date();
      const newEndDate = new Date(now);
      
      switch (subscription.type) {
        case 'monthly':
          newEndDate.setMonth(newEndDate.getMonth() + 1);
          break;
        case '3months':
          newEndDate.setMonth(newEndDate.getMonth() + 3);
          break;
        case 'yearly':
          newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          break;
        default:
          newEndDate.setMonth(newEndDate.getMonth() + 1);
      }
      
      // Обновляем дату начала на текущую дату и дату окончания на правильную
      await updateDoc(userRef, {
        'subscription.startDate': Timestamp.fromDate(now),
        'subscription.endDate': Timestamp.fromDate(newEndDate),
        'subscription.active': true,
        'subscription.updatedAt': serverTimestamp()
      });
      
      alert(language === 'en' 
        ? `Subscription date fixed! New end date: ${newEndDate.toLocaleDateString()}`
        : `Дата подписки исправлена! Новая дата окончания: ${newEndDate.toLocaleDateString('ru-RU')}`);
      await loadSubscribers();
    } catch (error) {
      console.error('Error fixing subscription date:', error);
      alert((language === 'en' ? 'Error fixing subscription date: ' : 'Ошибка при исправлении даты подписки: ') + error.message);
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
      // Получаем email пользователя для поиска
      const userEmail = selectedUserForSubscription?.email;
      const userDisplayName = selectedUserForSubscription?.displayName;
      
      console.log('[Admin] Starting activation:', { userId, userEmail, userDisplayName, type });
      
      // Если есть email, сначала пытаемся использовать API endpoint (более надежно)
      if (userEmail && userEmail !== 'No email') {
        try {
          console.log('[Admin] Trying API endpoint activation for:', userEmail);
          const response = await fetch('/api/subscription/manual-activate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userEmail,
              subscriptionType: type
            })
          });

          const result = await response.json();
          console.log('[Admin] API response:', result);

          if (response.ok && result.success) {
            console.log('[Admin] ✅ API activation successful!', result);
            
            // Проверяем, что подписка действительно сохранилась в Firestore
            const userRef = doc(db, 'users', result.userId);
            await new Promise(resolve => setTimeout(resolve, 500)); // Небольшая задержка для синхронизации Firestore
            
            const verifyDoc = await getDoc(userRef);
            const verifyData = verifyDoc.exists() ? verifyDoc.data() : {};
            
            console.log('[Admin] Verification - user document:', {
              exists: verifyDoc.exists(),
              hasSubscription: !!verifyData.subscription,
              subscription: verifyData.subscription
            });
            
            if (!verifyData.subscription || !verifyData.subscription.active) {
              console.error('[Admin] ❌ Subscription was not saved correctly!');
              throw new Error(language === 'en' 
                ? 'Subscription was activated but not saved. Please try again.'
                : 'Подписка была активирована, но не сохранена. Попробуйте еще раз.');
            }
            
            const endDate = new Date(result.endDate);
            const successMessage = language === 'en' 
              ? `✅ Subscription activated successfully!\n\nUser ID: ${result.userId}\nEmail: ${userEmail}\nType: ${type}\nEnd Date: ${endDate.toLocaleDateString()}\n\n✅ The subscription is now active and will be visible in the list.`
              : `✅ Подписка успешно активирована!\n\nID пользователя: ${result.userId}\nEmail: ${userEmail}\nТип: ${type}\nДата окончания: ${endDate.toLocaleDateString('ru-RU')}\n\n✅ Подписка теперь активна и будет видна в списке.`;
            
            alert(successMessage);
            
            // Закрываем модалку
            setShowActivateModal(false);
            setSelectedUserForSubscription(null);
            
            // Обновляем список подписчиков с небольшой задержкой
            console.log('[Admin] Reloading subscribers list...');
            await new Promise(resolve => setTimeout(resolve, 500)); // Задержка для синхронизации Firestore
            
            // Принудительно обновляем список
            setIsLoading(true);
            await loadSubscribers();
            setIsLoading(false);
            
            console.log('[Admin] Subscribers list reloaded');
            
            // Проверяем, что подписка видна в списке
            const updatedSubscribers = subscribers.filter(s => s.id === result.userId);
            if (updatedSubscribers.length > 0) {
              const sub = updatedSubscribers[0];
              console.log('[Admin] ✅ Subscription visible in list:', {
                id: sub.id,
                email: sub.email,
                isActive: sub.subscription.isActive,
                type: sub.subscription.type
              });
            } else {
              console.warn('[Admin] ⚠️ Subscription not found in list after reload');
            }
            
            // Дополнительная проверка через секунду
            setTimeout(async () => {
              const checkDoc = await getDoc(userRef);
              const checkData = checkDoc.exists() ? checkDoc.data() : {};
              console.log('[Admin] Final verification after 1 second:', {
                hasSubscription: !!checkData.subscription,
                isActive: checkData.subscription?.active,
                type: checkData.subscription?.type
              });
              
              // Если подписка все еще не видна, предлагаем обновить страницу
              if (!checkData.subscription || !checkData.subscription.active) {
                console.warn('[Admin] ⚠️ Subscription may not be visible. Consider refreshing the page.');
              } else {
                console.log('[Admin] ✅ Subscription is active and visible!');
              }
            }, 1000);
            
            return;
          } else {
            console.warn('[Admin] API returned error, trying direct method:', result.error);
            // Продолжаем с прямым методом
          }
        } catch (apiError) {
          console.error('[Admin] API activation failed, trying direct method:', apiError);
          // Продолжаем с прямым методом
        }
      }
      
      if (!userId) {
        throw new Error(language === 'en' ? 'User ID is required' : 'Требуется ID пользователя');
      }

      // Сначала пытаемся найти пользователя по userId
      let userRef = doc(db, 'users', userId);
      let userDoc = await getDoc(userRef);
      let userData = userDoc.exists() ? userDoc.data() : {};
      let finalUserId = userId;
      
      console.log('[Admin] User document by userId:', { exists: userDoc.exists(), email: userData.email });
      
      // Если документ не найден по userId, пытаемся найти по email
      if (!userDoc.exists() && userEmail) {
        console.log('[Admin] User not found by userId, searching by email:', userEmail);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const foundUserDoc = querySnapshot.docs[0];
          finalUserId = foundUserDoc.id;
          userRef = doc(db, 'users', finalUserId);
          userDoc = await getDoc(userRef);
          userData = userDoc.exists() ? userDoc.data() : {};
          console.log('[Admin] Found user by email, new userId:', finalUserId);
        } else {
          console.log('[Admin] User not found by email either, will create new document');
        }
      }
      
      // Вычисляем дату окончания подписки
      const now = new Date();
      let startDate = now;
      let endDate = new Date(now);
      
      // Проверяем, есть ли активная подписка
      if (userData.subscription && userData.subscription.endDate) {
        let existingEndDate = null;
        if (userData.subscription.endDate.toDate) {
          existingEndDate = userData.subscription.endDate.toDate();
        } else if (userData.subscription.endDate.seconds) {
          existingEndDate = new Date(userData.subscription.endDate.seconds * 1000);
        } else if (typeof userData.subscription.endDate === 'string') {
          existingEndDate = new Date(userData.subscription.endDate);
        }
        
        console.log('[Admin] Existing subscription end date:', existingEndDate);
        
        if (existingEndDate && existingEndDate > now) {
          endDate = new Date(existingEndDate);
          console.log('[Admin] Extending from existing end date');
          // Сохраняем оригинальную дату начала
          if (userData.subscription.startDate) {
            if (userData.subscription.startDate.toDate) {
              startDate = userData.subscription.startDate.toDate();
            } else if (userData.subscription.startDate.seconds) {
              startDate = new Date(userData.subscription.startDate.seconds * 1000);
            }
          }
        }
      }
      
      // Добавляем период подписки
      // Используем более надежный способ: добавляем дни напрямую
      let subscriptionAmount = 990;
      const daysToAdd = (() => {
      switch (type) {
        case 'monthly':
            subscriptionAmount = 990;
            return 30; // 30 дней для месячной подписки
        case '3months':
            subscriptionAmount = 2490;
            return 90; // 90 дней для 3-месячной подписки
        case 'yearly':
            subscriptionAmount = 8290;
            return 365; // 365 дней для годовой подписки
        default:
            subscriptionAmount = 990;
            return 30;
      }
      })();
      
      endDate.setDate(endDate.getDate() + daysToAdd);
      console.log(`[Admin] Adding ${daysToAdd} days (${type}): ${endDate.toISOString()}`);

      const subscriptionData = {
        active: true,
        type: type,
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        paymentId: `manual_${Date.now()}`,
        amount: subscriptionAmount,
        updatedAt: serverTimestamp()
      };

      console.log('[Admin] Subscription data to save:', {
        ...subscriptionData,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // ВАЖНО: Всегда сначала ищем по email, чтобы избежать дубликатов
      if (!userDoc.exists() && userEmail) {
        console.log('[Admin] User document not found by userId, searching by email:', userEmail);
        const usersRef = collection(db, 'users');
        const emailQuery = query(usersRef, where('email', '==', userEmail), limit(1));
        const emailQuerySnapshot = await getDocs(emailQuery);
        
        if (!emailQuerySnapshot.empty) {
          const existingUserDoc = emailQuerySnapshot.docs[0];
          const existingUserId = existingUserDoc.id;
          console.log('[Admin] ✅ Found existing user by email:', existingUserId, 'using it instead of creating new');
          userRef = doc(db, 'users', existingUserId);
          userDoc = await getDoc(userRef);
          finalUserId = existingUserId;
        }
      }
      
      // Сохраняем или обновляем подписку
      if (!userDoc.exists()) {
        // Создаем новый документ пользователя (только если не найден по email)
        const newUserData = {
          subscription: subscriptionData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Добавляем email и displayName, если они есть
        if (userEmail) {
          newUserData.email = userEmail;
        }
        if (userDisplayName) {
          newUserData.displayName = userDisplayName;
        }
        
        await setDoc(userRef, newUserData, { merge: true });
        console.log('[Admin] Created new user document with subscription');
      } else {
        // Обновляем существующий документ
        await updateDoc(userRef, {
          subscription: subscriptionData,
          updatedAt: serverTimestamp()
        });
        console.log('[Admin] Updated subscription in existing user document');
      }
      
      // Проверяем, что подписка сохранилась
      const verifyDoc = await getDoc(userRef);
      const verifyData = verifyDoc.exists() ? verifyDoc.data() : {};
      console.log('[Admin] Verification - subscription saved:', verifyData.subscription);
      
      if (!verifyData.subscription || !verifyData.subscription.active) {
        throw new Error(language === 'en' 
          ? 'Subscription was not saved correctly'
          : 'Подписка не была сохранена корректно');
      }
      
      const successMessage = language === 'en' 
        ? `Subscription activated successfully!\n\nUser ID: ${finalUserId}\nEmail: ${userEmail || userData.email || 'N/A'}\nType: ${type}\nEnd Date: ${endDate.toLocaleDateString()}`
        : `Подписка успешно активирована!\n\nID пользователя: ${finalUserId}\nEmail: ${userEmail || userData.email || 'N/A'}\nТип: ${type}\nДата окончания: ${endDate.toLocaleDateString('ru-RU')}`;
      
      alert(successMessage);
      setShowActivateModal(false);
      setSelectedUserForSubscription(null);
      await loadSubscribers();
    } catch (error) {
      console.error('[Admin] Error activating subscription:', error);
      console.error('[Admin] Error details:', {
        message: error.message,
        stack: error.stack,
        userId,
        type,
        selectedUser: selectedUserForSubscription
      });
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
            <div className="bg-brand-500/10 backdrop-blur-sm rounded-xl p-4 border border-brand-500/20">
              <div className="text-brand-400/60 text-sm mb-1">{language === 'en' ? 'Active' : 'Активных'}</div>
              <div className="text-2xl font-bold text-brand-400">{stats.active}</div>
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
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-brand-500"
                />
                <button
                  onClick={handleSearchUser}
                  className="px-4 py-2 bg-brand-500/20 text-brand-400 rounded-lg hover:bg-brand-500/30 transition-colors"
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
                                  ? 'bg-brand-500/20 text-brand-400'
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
                        ? 'bg-brand-500 text-white'
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
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'Payment ID' : 'ID платежа'}</th>
                    <th className="px-6 py-4 text-left text-white/60 text-sm font-medium">{language === 'en' ? 'Actions' : 'Действия'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-white/60">
                        {language === 'en' ? 'No subscribers found' : 'Подписчики не найдены'}
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((subscriber) => (
                      <tr key={subscriber.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-white font-medium">{subscriber.displayName}</div>
                          <div className="text-white/60 text-sm">{subscriber.email}</div>
                          <div className="text-white/40 text-xs mt-1">ID: {subscriber.id}</div>
                          {subscriber.hasDuplicates && (
                            <div className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                              <span>⚠️</span>
                              <span>{language === 'en' ? `${subscriber.duplicateCount} accounts` : `${subscriber.duplicateCount} аккаунтов`}</span>
                            </div>
                          )}
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
                              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/50'
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
                        <td className="px-6 py-4 text-white/60 text-xs">
                          {subscriber.subscription.paymentId ? (
                            <span className="font-mono" title={subscriber.subscription.paymentId}>
                              {subscriber.subscription.paymentId.length > 20 
                                ? subscriber.subscription.paymentId.substring(0, 20) + '...'
                                : subscriber.subscription.paymentId}
                            </span>
                          ) : (
                            <span className="text-white/30">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => handleExtendSubscription(subscriber.id, 30)}
                              className="bg-brand-500/20 text-brand-400 px-3 py-1 rounded-lg text-sm hover:bg-brand-500/30 transition-colors"
                              title={language === 'en' ? 'Extend 30 days' : 'Продлить на 30 дней'}
                            >
                              +30
                            </button>
                            <button
                              onClick={() => handleFixSubscriptionDate(subscriber.id)}
                              className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                              title={language === 'en' ? 'Fix subscription date (set to 1 month from now)' : 'Исправить дату подписки (установить на 1 месяц с сегодня)'}
                            >
                              🔧
                            </button>
                            {subscriber.hasDuplicates && (
                              <button
                                onClick={() => handleMergeDuplicateAccounts(subscriber.email)}
                                className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
                                title={language === 'en' ? 'Merge duplicate accounts into one' : 'Объединить дубликаты аккаунтов в один'}
                              >
                                🔀
                              </button>
                            )}
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
                                onClick={() => {
                                  setSelectedUserForSubscription(subscriber);
                                  setSubscriptionType(subscriber.subscription.type || 'monthly');
                                  setShowActivateModal(true);
                                }}
                                className="bg-brand-500/20 text-brand-400 px-3 py-1 rounded-lg text-sm hover:bg-brand-500/30 transition-colors"
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
                        ? 'bg-brand-500 text-white'
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
                className="flex-1 bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-brand-400 transition-colors"
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

