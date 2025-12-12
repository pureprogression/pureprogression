// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, setLogLevel, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, updateDoc, getDoc, setDoc, where, Timestamp, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Проверка конфигурации Firebase (только для разработки)
if (process.env.NODE_ENV === 'development') {
  try {
    const missing = Object.entries(firebaseConfig)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      console.warn("[Firebase] Отсутствуют переменные окружения:", missing.join(", "));
    }
  } catch {}
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Отключаем кэширование Firebase для решения проблем с удалением
try {
  initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    experimentalLongPollingOptions: { timeoutSeconds: 30 },
    useFetchStreams: true,
    // Отключаем локальное кэширование
    localCache: {
      kind: "disabled"
    }
  });
  setLogLevel("error");
} catch {}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };

// Функции для работы с отзывами
export const saveReview = async (reviewData) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      createdAt: serverTimestamp(),
      approved: false // Отзывы требуют модерации
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Ошибка при сохранении отзыва:', error);
    return { success: false, error: error.message };
  }
};

export const getReviews = async (limitCount = 10) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const reviews = [];
    querySnapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, reviews };
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    return { success: false, error: error.message };
  }
};

// Функции для работы с недельными планами
export const createWeeklyPlan = async (planData) => {
  try {
    const plansRef = collection(db, 'weeklyPlans');
    const weekStart = Timestamp.fromDate(new Date(planData.weekStartDate));
    const weekEnd = new Date(planData.weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndTimestamp = Timestamp.fromDate(weekEnd);

    // Создаем массив дней с датами
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(planData.weekStartDate);
      dayDate.setDate(dayDate.getDate() + i);
      days.push({
        dayNumber: i + 1,
        date: Timestamp.fromDate(dayDate),
        dayTitle: planData.days[i]?.dayTitle || '',
        dayGoal: planData.days[i]?.dayGoal || '',
        morningTasks: planData.days[i]?.morningTasks || [],
        dayTasks: planData.days[i]?.dayTasks || [],
        eveningTasks: planData.days[i]?.eveningTasks || [],
        dayNotes: planData.days[i]?.dayNotes || ''
      });
    }

    const docRef = await addDoc(plansRef, {
      assignedUserId: planData.assignedUserId,
      createdBy: planData.createdBy,
      weekStartDate: weekStart,
      weekEndDate: weekEndTimestamp,
      goals: planData.goals || [],
      days: days,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Ошибка при создании недельного плана:', error);
    return { success: false, error: error.message };
  }
};

// Функция для получения userId по email (ищет в коллекции users)
export const getUserIdByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: true, userId: querySnapshot.docs[0].id, userData: querySnapshot.docs[0].data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Ошибка при поиске пользователя:', error);
    return { success: false, error: error.message };
  }
};

// Функция для получения всех пользователей (для админ-панели)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, users };
  } catch (error) {
    console.error('Ошибка при получении пользователей:', error);
    return { success: false, error: error.message };
  }
};

export const getActiveWeeklyPlan = async (userId) => {
  try {
    const plansRef = collection(db, 'weeklyPlans');
    // Ищем по userId, затем фильтруем по статусу и сортируем вручную
    // (чтобы избежать необходимости в составном индексе)
    const q = query(
      plansRef,
      where('assignedUserId', '==', userId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { success: true, plan: null };
    }
    // Сортируем вручную по createdAt
    const plans = [];
    querySnapshot.forEach((doc) => {
      plans.push({ id: doc.id, ...doc.data() });
    });
    // Сортируем по дате создания (новые первыми)
    plans.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
      return bTime - aTime;
    });
    return { success: true, plan: plans[0] || null };
  } catch (error) {
    console.error('Ошибка при получении активного плана:', error);
    return { success: false, error: error.message };
  }
};

export const updateWeeklyPlan = async (planId, updates) => {
  try {
    const planRef = doc(db, 'weeklyPlans', planId);
    await updateDoc(planRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Ошибка при обновлении плана:', error);
    return { success: false, error: error.message };
  }
};

export const updateTaskStatus = async (planId, dayIndex, taskId, status) => {
  // status может быть: true (выполнено), false (не выполнено)
  // Если нажимаем на уже активный статус, отжимаем его (устанавливаем null)
  try {
    const planRef = doc(db, 'weeklyPlans', planId);
    const planDoc = await getDoc(planRef);
    if (!planDoc.exists()) {
      return { success: false, error: 'Plan not found' };
    }
    const planData = planDoc.data();
    const days = [...planData.days];
    const day = days[dayIndex];
    
    // Поддержка новой структуры (morningTasks/dayTasks/eveningTasks) и старой (tasks)
    let taskArray = null;
    let taskArrayKey = null;
    
    if (day.morningTasks || day.dayTasks || day.eveningTasks) {
      // Новая структура - ищем в трех массивах
      const taskArrays = [
        { key: 'morningTasks', arr: day.morningTasks || [] },
        { key: 'dayTasks', arr: day.dayTasks || [] },
        { key: 'eveningTasks', arr: day.eveningTasks || [] }
      ];
      
      for (const { key, arr } of taskArrays) {
        const taskIndex = arr.findIndex(t => String(t.id) === String(taskId));
        if (taskIndex !== -1) {
          taskArray = [...arr];
          taskArrayKey = key;
          break;
        }
      }
    } else {
      // Старая структура
      taskArray = [...(day.tasks || [])];
      taskArrayKey = 'tasks';
    }
    
    if (!taskArray) {
      console.error('Task not found:', { taskId });
      return { success: false, error: 'Task not found' };
    }
    
    const taskIndex = taskArray.findIndex(t => String(t.id) === String(taskId));
    if (taskIndex === -1) {
      console.error('Task not found:', { taskId });
      return { success: false, error: 'Task not found' };
    }
    
    // Если нажимаем на уже активный статус, отжимаем его (устанавливаем null)
    const currentStatus = taskArray[taskIndex].completed;
    let newStatus = status;
    if (currentStatus === status) {
      newStatus = null; // Отжимаем кнопку
    }
    
    taskArray[taskIndex] = {
      ...taskArray[taskIndex],
      completed: newStatus,
      completedAt: newStatus === true ? new Date() : null,
      failedAt: newStatus === false ? new Date() : null
    };
    
    days[dayIndex] = { ...days[dayIndex], [taskArrayKey]: taskArray };
    await updateDoc(planRef, {
      days: days,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Ошибка при обновлении задачи:', error);
    return { success: false, error: error.message };
  }
};

export const addTaskComment = async (planId, dayIndex, taskId, comment, userId) => {
  try {
    const planRef = doc(db, 'weeklyPlans', planId);
    const planDoc = await getDoc(planRef);
    if (!planDoc.exists()) {
      return { success: false, error: 'Plan not found' };
    }
    const planData = planDoc.data();
    const days = [...planData.days];
    const day = days[dayIndex];
    
    // Поддержка новой структуры (morningTasks/dayTasks/eveningTasks) и старой (tasks)
    let taskArray = null;
    let taskArrayKey = null;
    
    if (day.morningTasks || day.dayTasks || day.eveningTasks) {
      // Новая структура - ищем в трех массивах
      const taskArrays = [
        { key: 'morningTasks', arr: day.morningTasks || [] },
        { key: 'dayTasks', arr: day.dayTasks || [] },
        { key: 'eveningTasks', arr: day.eveningTasks || [] }
      ];
      
      for (const { key, arr } of taskArrays) {
        const taskIndex = arr.findIndex(t => String(t.id) === String(taskId));
        if (taskIndex !== -1) {
          taskArray = [...arr];
          taskArrayKey = key;
          break;
        }
      }
    } else {
      // Старая структура
      taskArray = [...(day.tasks || [])];
      taskArrayKey = 'tasks';
    }
    
    if (!taskArray) {
      console.error('Task not found for comment:', { taskId });
      return { success: false, error: 'Task not found' };
    }
    
    const taskIndex = taskArray.findIndex(t => String(t.id) === String(taskId));
    if (taskIndex === -1) {
      console.error('Task not found for comment:', { taskId });
      return { success: false, error: 'Task not found' };
    }
    
    // Сохраняем комментарий (только если он не пустой)
    const trimmedComment = comment ? String(comment).trim() : '';
    if (!trimmedComment) {
      return { success: false, error: 'Comment cannot be empty' };
    }
    
    const currentTask = { ...taskArray[taskIndex] };
    currentTask.userComment = {
      text: trimmedComment,
      createdAt: taskArray[taskIndex].userComment?.createdAt || new Date(),
      updatedAt: new Date(),
      userId: userId
    };
    taskArray[taskIndex] = currentTask;
    
    // Создаем полностью новый массив days для гарантии обновления
    const newDays = days.map((d, idx) => {
      if (idx === dayIndex) {
        return { ...d, [taskArrayKey]: taskArray };
      }
      return d;
    });
    
    await updateDoc(planRef, {
      days: newDays,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при добавлении комментария:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTaskComment = async (planId, dayIndex, taskId) => {
  try {
    const planRef = doc(db, 'weeklyPlans', planId);
    const planDoc = await getDoc(planRef);
    if (!planDoc.exists()) {
      return { success: false, error: 'Plan not found' };
    }
    const planData = planDoc.data();
    const days = [...planData.days];
    const day = days[dayIndex];
    
    // Поддержка новой структуры (morningTasks/dayTasks/eveningTasks) и старой (tasks)
    let taskArray = null;
    let taskArrayKey = null;
    
    if (day.morningTasks || day.dayTasks || day.eveningTasks) {
      // Новая структура - ищем в трех массивах
      const taskArrays = [
        { key: 'morningTasks', arr: day.morningTasks || [] },
        { key: 'dayTasks', arr: day.dayTasks || [] },
        { key: 'eveningTasks', arr: day.eveningTasks || [] }
      ];
      
      for (const { key, arr } of taskArrays) {
        const taskIndex = arr.findIndex(t => String(t.id) === String(taskId));
        if (taskIndex !== -1) {
          taskArray = [...arr];
          taskArrayKey = key;
          break;
        }
      }
    } else {
      // Старая структура
      taskArray = [...(day.tasks || [])];
      taskArrayKey = 'tasks';
    }
    
    if (!taskArray) {
      console.error('Task not found for comment deletion:', { taskId });
      return { success: false, error: 'Task not found' };
    }
    
    const taskIndex = taskArray.findIndex(t => String(t.id) === String(taskId));
    if (taskIndex === -1) {
      console.error('Task not found for comment deletion:', { taskId });
      return { success: false, error: 'Task not found' };
    }
    
    // Удаляем userComment - полностью пересоздаем объект задачи без этого поля
    const taskToUpdate = taskArray[taskIndex];
    
    // Создаем новый объект задачи, копируя все поля кроме userComment
    const { userComment, ...taskWithoutComment } = taskToUpdate;
    
    // Создаем новый массив с обновленной задачей
    const newTaskArray = taskArray.map((t, idx) => 
      idx === taskIndex ? taskWithoutComment : t
    );
    
    // Создаем полностью новый массив days
    const newDays = days.map((d, idx) => {
      if (idx === dayIndex) {
        return { ...d, [taskArrayKey]: newTaskArray };
      }
      return d;
    });
    
    await updateDoc(planRef, {
      days: newDays,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Ошибка при удалении комментария:', error);
    return { success: false, error: error.message };
  }
};

export const getAllWeeklyPlans = async (adminUserId) => {
  try {
    const plansRef = collection(db, 'weeklyPlans');
    const q = query(
      plansRef,
      where('createdBy', '==', adminUserId)
    );
    const querySnapshot = await getDocs(q);
    const plans = [];
    querySnapshot.forEach((doc) => {
      plans.push({ id: doc.id, ...doc.data() });
    });
    // Сортируем вручную по дате создания (новые первыми)
    plans.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
      return bTime - aTime;
    });
    return { success: true, plans };
  } catch (error) {
    console.error('Ошибка при получении всех планов:', error);
    return { success: false, error: error.message };
  }
};

export const completeWeeklyPlan = async (planId) => {
  try {
    const planRef = doc(db, 'weeklyPlans', planId);
    await updateDoc(planRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Ошибка при завершении плана:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWeeklyPlan = async (planId) => {
  try {
    const planRef = doc(db, 'weeklyPlans', planId);
    await deleteDoc(planRef);
    return { success: true };
  } catch (error) {
    console.error('Ошибка при удалении плана:', error);
    return { success: false, error: error.message };
  }
};

// Функция проверки админа (пока по email)
export const isAdmin = (user) => {
  if (!user || !user.email) return false;
  
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  
  // Для отладки (только в development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Admin Check] User email:', user.email);
    console.log('[Admin Check] Admin email from env:', adminEmail);
  }
  
  if (!adminEmail) {
    console.warn('[Admin Check] NEXT_PUBLIC_ADMIN_EMAIL не установлен в переменных окружения');
    return false;
  }
  
  return user.email === adminEmail;
};

// Функции для работы с запросами планов
export const createPlanRequest = async (userId, requestData) => {
  try {
    const requestRef = await addDoc(collection(db, 'planRequests'), {
      userId: userId,
      categories: requestData.categories || [],
      goals: requestData.goals || '',
      currentLevel: requestData.currentLevel || 'medium',
      limitations: requestData.limitations || '',
      additionalInfo: requestData.additionalInfo || '',
      status: 'new', // new, in_progress, plan_created
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, requestId: requestRef.id };
  } catch (error) {
    console.error('Ошибка при создании запроса плана:', error);
    return { success: false, error: error.message };
  }
};

export const getUserPlanRequests = async (userId) => {
  try {
    const requestsRef = collection(db, 'planRequests');
    const q = query(requestsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    // Сортируем вручную по дате создания (новые сначала)
    requests.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
    return { success: true, requests };
  } catch (error) {
    console.error('Ошибка при получении запросов пользователя:', error);
    return { success: false, error: error.message, requests: [] };
  }
};

export const getAllPlanRequests = async () => {
  try {
    const requestsRef = collection(db, 'planRequests');
    const querySnapshot = await getDocs(requestsRef);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    // Сортируем по дате создания (новые сначала)
    requests.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime - aTime;
    });
    return { success: true, requests };
  } catch (error) {
    console.error('Ошибка при получении всех запросов:', error);
    return { success: false, error: error.message, requests: [] };
  }
};

export const updatePlanRequestStatus = async (requestId, status) => {
  try {
    const requestRef = doc(db, 'planRequests', requestId);
    await updateDoc(requestRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Ошибка при обновлении статуса запроса:', error);
    return { success: false, error: error.message };
  }
};

export const getPlanRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'planRequests', requestId);
    const requestDoc = await getDoc(requestRef);
    if (!requestDoc.exists()) {
      return { success: false, error: 'Request not found' };
    }
    return { success: true, request: { id: requestDoc.id, ...requestDoc.data() } };
  } catch (error) {
    console.error('Ошибка при получении запроса:', error);
    return { success: false, error: error.message };
  }
};

export const deletePlanRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'planRequests', requestId);
    await deleteDoc(requestRef);
    return { success: true };
  } catch (error) {
    console.error('Ошибка при удалении запроса плана:', error);
    return { success: false, error: error.message };
  }
};