"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import WorkoutBuilderV2 from "@/components/WorkoutBuilderV2";
import PremiumModal from "@/components/PremiumModal";
import { auth, db, isAdmin } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackWorkoutCreated } from "@/lib/analytics";
import { useSubscription } from "@/hooks/useSubscription";

export default function WorkoutBuilderV2Page() {
  const router = useRouter();
  const { user, hasSubscription, isLoading: subscriptionLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading && !subscriptionLoading && !user) {
      router.push('/auth');
    }
  }, [isLoading, subscriptionLoading, user, router]);

  useEffect(() => {
    if (!isLoading && !subscriptionLoading && user && !hasSubscription && !isAdmin(user)) {
      setShowPremiumModal(true);
    }
  }, [isLoading, subscriptionLoading, user, hasSubscription]);

  const handleSaveWorkout = async (workout) => {
    setIsSaving(true);
    
    try {
      const workoutData = {
        name: workout.name,
        description: workout.description || "",
        exercises: workout.exercises,
        userId: user.uid,
        createdAt: serverTimestamp(),
        estimatedDuration: workout.estimatedDuration
      };

      await addDoc(collection(db, 'workouts'), workoutData);
      trackWorkoutCreated(workout.exercises.length);
      router.push('/my-workouts');
    } catch (error) {
      console.error("Ошибка при сохранении тренировки:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/my-workouts');
  };

  if (isLoading || subscriptionLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  if (!hasSubscription && !isAdmin(user)) {
    return (
      <>
        <Navigation currentPage="workout-builder" user={user} />
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => {
            setShowPremiumModal(false);
            router.push('/');
          }}
          feature={language === 'en' ? 'Workout Builder' : 'Конструктор тренировок'}
          requiresAuth={false}
        />
        <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-xl mb-4">
              {language === 'en' 
                ? 'This feature requires an active subscription'
                : 'Эта функция требует активной подписки'}
            </p>
            <button
              onClick={() => router.push('/subscribe')}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-400 hover:to-emerald-400 transition-all"
            >
              {language === 'en' ? 'Subscribe Now' : 'Оформить подписку'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation currentPage="workout-builder" user={user} />
      <WorkoutBuilderV2 
        onSave={handleSaveWorkout}
        onCancel={handleCancel}
        isSaving={isSaving}
      />
    </>
  );
}

