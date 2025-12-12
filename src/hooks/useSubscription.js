import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { checkUserSubscription } from '@/lib/payments';

export function useSubscription() {
  const [user, setUser] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      
      if (u) {
        // Загружаем подписку из Firebase
        await loadSubscription(u.uid);
        
        // Подписываемся на изменения подписки
        const userRef = doc(db, 'users', u.uid);
        const unsubscribeSubscription = onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            const sub = userData.subscription || null;
            
            if (sub) {
              // Проверяем, активна ли подписка и не истекла ли она
              const now = new Date();
              let endDate;
              
              // Обрабатываем разные форматы даты
              if (sub.endDate?.toDate) {
                // Firestore Timestamp
                endDate = sub.endDate.toDate();
              } else if (sub.endDate?.seconds) {
                // Firestore Timestamp в формате {seconds, nanoseconds}
                endDate = new Date(sub.endDate.seconds * 1000);
              } else if (typeof sub.endDate === 'string') {
                // ISO строка
                endDate = new Date(sub.endDate);
              } else if (sub.endDate instanceof Date) {
                endDate = sub.endDate;
              } else {
                // Если не можем распарсить, считаем что подписка активна если active = true
                console.warn('Unknown endDate format:', sub.endDate);
                endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 дней по умолчанию
              }
              
              // Если active = true, но дата невалидна, считаем подписку активной (для тестирования)
              let isActive;
              if (sub.active) {
                if (isNaN(endDate.getTime())) {
                  // Дата невалидна, но active = true - считаем активной
                  console.warn('Invalid endDate but active=true, treating as active');
                  isActive = true;
                } else {
                  isActive = endDate > now;
                }
              } else {
                isActive = false;
              }
              
              // Отладочная информация
              if (process.env.NODE_ENV === 'development') {
                console.log('Subscription check:', {
                  active: sub.active,
                  endDate: endDate.toISOString(),
                  now: now.toISOString(),
                  isActive,
                  subscription: sub
                });
              }
              
              setHasSubscription(isActive);
              setSubscription({
                ...sub,
                isActive,
                expiresAt: endDate
              });
            } else {
              setHasSubscription(false);
              setSubscription(null);
            }
          } else {
            setHasSubscription(false);
            setSubscription(null);
          }
          setIsLoading(false);
        });
        
        return () => {
          unsubscribeSubscription();
        };
      } else {
        setHasSubscription(false);
        setSubscription(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const loadSubscription = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const sub = userData.subscription || null;
        
        if (sub) {
          // Проверяем, активна ли подписка и не истекла ли она
          const now = new Date();
          let endDate;
          
          // Обрабатываем разные форматы даты
          if (sub.endDate?.toDate) {
            // Firestore Timestamp
            endDate = sub.endDate.toDate();
          } else if (sub.endDate?.seconds) {
            // Firestore Timestamp в формате {seconds, nanoseconds}
            endDate = new Date(sub.endDate.seconds * 1000);
          } else if (typeof sub.endDate === 'string') {
            // ISO строка
            endDate = new Date(sub.endDate);
          } else if (sub.endDate instanceof Date) {
            endDate = sub.endDate;
          } else {
            // Если не можем распарсить, считаем что подписка активна если active = true
            console.warn('Unknown endDate format:', sub.endDate);
            endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 дней по умолчанию
          }
          
          const isActive = sub.active && endDate > now;
          
          // Отладочная информация
          if (process.env.NODE_ENV === 'development') {
            console.log('Subscription check (loadSubscription):', {
              active: sub.active,
              endDate: endDate.toISOString(),
              now: now.toISOString(),
              isActive,
              subscription: sub
            });
          }
          
          setHasSubscription(isActive);
          setSubscription({
            ...sub,
            isActive,
            expiresAt: endDate
          });
        } else {
          setHasSubscription(false);
          setSubscription(null);
        }
      } else {
        setHasSubscription(false);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setHasSubscription(false);
      setSubscription(null);
    }
  };

  return {
    user,
    hasSubscription,
    subscription,
    isLoading
  };
}

