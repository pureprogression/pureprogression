import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
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
        console.log('[useSubscription] User authenticated:', {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName
        });
        
        // Загружаем подписку из Firebase, передаем email из Auth на случай если его нет в документе
        await loadSubscription(u.uid, u.email);
        
        // Подписываемся на изменения подписки
        const userRef = doc(db, 'users', u.uid);
        const userAuthEmail = u.email; // Сохраняем email из Auth для использования в onSnapshot
        console.log('[useSubscription] Listening to user document:', u.uid);
        const unsubscribeSubscription = onSnapshot(userRef, (docSnapshot) => {
          console.log('[useSubscription] Document snapshot received:', {
            exists: docSnapshot.exists(),
            userId: u.uid,
            email: u.email
          });
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            const userEmail = userData.email || userAuthEmail; // Используем email из документа или из Auth
            const sub = userData.subscription || null;
            const hasActiveSubscription = sub && sub.active;
            
            // Если подписки нет или она неактивна, но есть email, запускаем поиск в фоне (не блокируем UI)
            if ((!sub || !hasActiveSubscription) && userEmail) {
              console.log('[useSubscription] ⚠️ No active subscription in snapshot, will search by email in background:', userEmail);
              // Запускаем поиск асинхронно, не блокируя обработку
              (async () => {
                try {
                  const usersRef = collection(db, 'users');
                  const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);
                  
                  for (const otherDoc of querySnapshot.docs) {
                    if (otherDoc.id !== u.uid) {
                      const otherData = otherDoc.data();
                      if (otherData.subscription && otherData.subscription.active) {
                        console.log('[useSubscription] Found active subscription in another document, copying...');
                  await updateDoc(userRef, {
                    subscription: otherData.subscription,
                    email: userEmail || otherData.email,
                    updatedAt: serverTimestamp()
                  });
                        console.log('[useSubscription] ✅ Subscription copied to correct document');
                        // Подписка будет обновлена через следующий onSnapshot
                        return;
                      }
                    }
                  }
                } catch (searchError) {
                  console.error('[useSubscription] Error searching for subscription:', searchError);
                }
              })();
            }
            
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
              console.log('[useSubscription] Subscription check:', {
                userId: u.uid,
                email: u.email,
                active: sub.active,
                endDate: endDate.toISOString(),
                now: now.toISOString(),
                isActive,
                type: sub.type
              });
              
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

  const loadSubscription = async (userId, authEmail = null) => {
    try {
      console.log('[useSubscription] loadSubscription called for userId:', userId, 'authEmail:', authEmail);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      console.log('[useSubscription] User document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userEmail = userData.email || authEmail; // Используем email из документа или из Auth
        
        console.log('[useSubscription] User data:', {
          email: userEmail,
          emailInDoc: userData.email,
          emailInAuth: authEmail,
          hasSubscription: !!userData.subscription,
          subscriptionActive: userData.subscription?.active
        });
        
        const sub = userData.subscription || null;
        const hasActiveSubscription = sub && sub.active;
        
        // Если подписки нет или она неактивна, но есть email, ищем активную подписку в других документах с таким же email
        if ((!sub || !hasActiveSubscription) && userEmail) {
          console.log('[useSubscription] ⚠️ No active subscription in current document, searching by email:', userEmail);
          try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));
            const querySnapshot = await getDocs(q);
            
            console.log('[useSubscription] Found documents with same email:', querySnapshot.size);
            
            // Ищем активную подписку в других документах
            for (const otherDoc of querySnapshot.docs) {
              console.log('[useSubscription] Checking document:', {
                id: otherDoc.id,
                isCurrentUser: otherDoc.id === userId,
                hasSubscription: !!otherDoc.data().subscription,
                subscriptionActive: otherDoc.data().subscription?.active
              });
              
              if (otherDoc.id !== userId) {
                const otherData = otherDoc.data();
                if (otherData.subscription && otherData.subscription.active) {
                  console.log('[useSubscription] ✅ Found active subscription in another document:', otherDoc.id);
                  console.log('[useSubscription] Subscription data:', otherData.subscription);
                  
                  // Копируем подписку в правильный документ
                  await updateDoc(userRef, {
                    subscription: otherData.subscription,
                    email: userEmail || otherData.email,
                    updatedAt: serverTimestamp()
                  });
                  console.log('[useSubscription] ✅ Copied subscription to correct user document');
                  
                  // Используем скопированную подписку
                  const copiedSub = otherData.subscription;
                  // Обрабатываем подписку дальше
                  const now = new Date();
                  let endDate;
                  if (copiedSub.endDate?.toDate) {
                    endDate = copiedSub.endDate.toDate();
                  } else if (copiedSub.endDate?.seconds) {
                    endDate = new Date(copiedSub.endDate.seconds * 1000);
                  } else if (typeof copiedSub.endDate === 'string') {
                    endDate = new Date(copiedSub.endDate);
                  } else {
                    endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                  }
                  const isActive = copiedSub.active && endDate > now;
                  
                  console.log('[useSubscription] ✅ Setting subscription as active:', {
                    isActive,
                    endDate: endDate.toISOString(),
                    now: now.toISOString()
                  });
                  
                  setHasSubscription(isActive);
                  setSubscription({
                    ...copiedSub,
                    isActive,
                    expiresAt: endDate
                  });
                  return;
                }
              }
            }
            
            console.log('[useSubscription] ⚠️ No active subscription found in other documents');
          } catch (searchError) {
            console.error('[useSubscription] ❌ Error searching for subscription by email:', searchError);
          }
        } else if (!sub && !userData.email) {
          console.log('[useSubscription] ⚠️ No subscription and no email in user document');
        }
        
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

