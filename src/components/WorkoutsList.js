"use client";

import { useRouter } from "next/navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WorkoutsList({ workouts, user }) {
  const router = useRouter();
  const { language } = useLanguage();


  const handleStartWorkout = (workout) => {
    // Проверяем, что тренировка существует и имеет упражнения
    if (!workout || !workout.id || !workout.exercises || workout.exercises.length === 0) {
      alert("Workout is corrupted or contains no exercises");
      return;
    }
    
    router.push(`/workout/${workout.id}`);
  };


  if (!workouts || workouts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-4">You don&apos;t have any saved workouts yet</div>
        <button
          onClick={() => router.push('/workout-builder')}
          className="bg-white text-black py-2 px-6 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300"
        >
          Create First Workout
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout) => (
        <div
          key={workout.id}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all duration-300 cursor-pointer"
          onClick={() => handleStartWorkout(workout)}
        >

          {/* Заголовок и дата */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-white text-xl font-semibold mb-1">{workout.name}</h3>
              {workout.description && (
                <p className="text-gray-300 text-sm">{workout.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">
                {workout.exercises?.length || 0} exercises
              </div>
              <div className="text-gray-500 text-xs">
                {workout.createdAt?.toDate ? 
                  workout.createdAt.toDate().toLocaleDateString('ru-RU') : 
                  'Recently'
                }
              </div>
            </div>
          </div>

          {/* Превью упражнений */}
          {workout.exercises && workout.exercises.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {workout.exercises.slice(0, 4).map((exercise, index) => (
                <div key={index} className="flex-shrink-0">
                  <img
                    src={
                      exercise.poster || 
                      exercise.video.replace('/videos/', '/posters/').replace('.mp4', '.jpg')
                    }
                    alt={exercise.title || 'Exercise'}
                    className="w-16 h-16 rounded-lg object-cover bg-gray-800"
                    loading="lazy"
                  />
                </div>
              ))}
              {workout.exercises.length > 4 && (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    +{workout.exercises.length - 4}
                  </span>
                </div>
              )}
            </div>
          )}

        </div>
      ))}

    </div>
  );
}
