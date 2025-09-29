// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, setLogLevel } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Простейшая диагностика: предупредить в консоли, если что-то из env не задано
try {
  const missing = Object.entries(firebaseConfig)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    // Не логируем сами значения, только имена ключей
    console.warn("[Firebase] Отсутствуют переменные окружения:", missing.join(", "));
  }
} catch {}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// В ряде окружений канал WebChannel блокируется/ломается. Включаем long polling.
try {
  // Автовыбор транспорта (fetch streams / long polling) в проблемных сетях
  initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    experimentalLongPollingOptions: { timeoutSeconds: 30 },
    useFetchStreams: true,
  });
  setLogLevel("debug");
} catch {}

export const auth = getAuth(app);
export const db = getFirestore(app);
export {app}