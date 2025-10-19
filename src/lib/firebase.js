// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, setLogLevel, collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";

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