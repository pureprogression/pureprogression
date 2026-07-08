"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import HomeIntro from "@/components/home/HomeIntro";
import WorkoutBuilder from "@/components/WorkoutBuilder";
import { db, isAdmin } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { trackWorkoutCreated } from "@/lib/analytics";
import { useSubscription } from "@/hooks/useSubscription";

export default function HomePage() {
  const router = useRouter();
  const { user, hasSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [restoredWorkout, setRestoredWorkout] = useState(null);

  const showIntro = !hasSubscription && (!user || !isAdmin(user));

  useEffect(() => {
    setIsLoading(false);
    if (typeof window !== "undefined") {
      const pendingWorkoutStr = localStorage.getItem("pending_workout");
      if (pendingWorkoutStr) {
        try {
          setRestoredWorkout(JSON.parse(pendingWorkoutStr));
        } catch (error) {
          console.error("Error parsing pending workout:", error);
        }
      }
    }
  }, []);

  const handleSaveWorkout = async (workout) => {
    if (!user) {
      const workoutToSave = {
        name: workout.name,
        description: workout.description || "",
        exercises: workout.exercises,
        estimatedDuration: workout.estimatedDuration,
        savedAt: Date.now(),
      };
      localStorage.setItem("pending_workout", JSON.stringify(workoutToSave));
      router.push("/auth?redirect=/subscribe");
      return;
    }

    if (!hasSubscription) {
      const workoutToSave = {
        name: workout.name,
        description: workout.description || "",
        exercises: workout.exercises,
        estimatedDuration: workout.estimatedDuration,
        savedAt: Date.now(),
      };
      localStorage.setItem("pending_workout", JSON.stringify(workoutToSave));
      router.push("/subscribe");
      return;
    }

    setIsSaving(true);
    try {
      const workoutData = {
        name: workout.name,
        description: workout.description || "",
        exercises: workout.exercises,
        userId: user.uid,
        createdAt: serverTimestamp(),
        estimatedDuration: workout.estimatedDuration,
      };
      await addDoc(collection(db, "workouts"), workoutData);
      localStorage.removeItem("pending_workout");
      trackWorkoutCreated(workout.exercises.length);
      setIsSaving(false);
      router.push("/my-workouts");
    } catch (error) {
      console.error("Ошибка при сохранении тренировки:", error);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/my-workouts");
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Navigation currentPage="home" user={user} />
      {showIntro && (
        <HomeIntro
          user={user}
          hasSubscription={hasSubscription}
          onGetAccess={user ? () => router.push("/subscribe") : undefined}
        />
      )}
      <div id="workout-builder">
        <WorkoutBuilder
          onSave={handleSaveWorkout}
          onCancel={handleCancel}
          isSaving={isSaving}
          initialWorkout={restoredWorkout}
        />
      </div>
    </>
  );
}
