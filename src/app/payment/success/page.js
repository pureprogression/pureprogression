"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { trackWorkoutCreated } from "@/lib/analytics";
import { useSubscription } from "@/hooks/useSubscription";
import { useLanguage } from "@/contexts/LanguageContext";
import { TEXTS } from "@/constants/texts";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const texts = TEXTS[language].subscription;
  const { hasSubscription, isLoading: subscriptionLoading } = useSubscription();
  const [user, setUser] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || subscriptionLoading) return;

    const savePendingWorkout = async () => {
      const pendingWorkoutStr = localStorage.getItem("pending_workout");
      if (!pendingWorkoutStr) return;

      try {
        const pendingWorkout = JSON.parse(pendingWorkoutStr);
        await addDoc(collection(db, "workouts"), {
          name: pendingWorkout.name,
          description: pendingWorkout.description || "",
          exercises: pendingWorkout.exercises,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        trackWorkoutCreated(user.uid);
        localStorage.removeItem("pending_workout");
      } catch (error) {
        console.error("[Payment Success] Error saving workout:", error);
      }
    };

    const redirectAfterSuccess = async () => {
      setActivated(true);

      const pendingWorkoutId = localStorage.getItem("pending_workout_id");
      if (pendingWorkoutId) {
        localStorage.removeItem("pending_workout_id");
        setTimeout(() => router.replace(`/workout/${pendingWorkoutId}`), 1200);
        return;
      }

      if (localStorage.getItem("pending_workout")) {
        await savePendingWorkout();
      }

      localStorage.removeItem("last_subscription_payment_id");
      localStorage.removeItem("last_subscription_type");
      localStorage.removeItem("last_subscription_user_id");
      setTimeout(() => router.replace("/my-workouts"), 1500);
    };

    if (hasSubscription) {
      redirectAfterSuccess();
    }
  }, [user, hasSubscription, subscriptionLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 45000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-6">
      <motion.div
        className="text-center max-w-sm w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 transition-colors duration-500 ${
            activated
              ? "border-brand-500 bg-brand-500/15"
              : "border-white/20 bg-white/5"
          }`}
        >
          {activated ? (
            <motion.svg
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="h-10 w-10 text-brand-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </motion.svg>
          ) : (
            <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-brand-400 animate-spin" />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {activated ? texts.paymentSuccessTitle : texts.paymentSuccessReceived}
        </h1>

        <p className="text-white/55 text-sm leading-relaxed mb-8">
          {activated
            ? texts.paymentSuccessSubtitle
            : timedOut
              ? texts.paymentSuccessTimeout
              : texts.paymentSuccessPending}
        </p>

        {(timedOut || activated) && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => router.push("/my-workouts")}
              className="w-full py-3.5 rounded-2xl bg-brand-500 text-black font-bold hover:bg-brand-400 transition-colors"
            >
              {texts.paymentSuccessWorkouts}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full py-3.5 rounded-2xl border border-white/15 text-white/80 font-medium hover:bg-white/5 transition-colors"
            >
              {texts.paymentSuccessBuilder}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
