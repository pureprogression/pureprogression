"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";

export default function WorkoutHistoryPage() {
  const [user, setUser] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState(null);

  useEffect(() => {
    let unsubscribe = null;
    
    const unsubscribeAuth = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        
        // Загружаем историю тренировок
        const historyQuery = query(
          collection(db, "workoutHistory"),
          where("userId", "==", u.uid)
        );
        unsubscribe = onSnapshot(historyQuery, (snapshot) => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          // Сортируем на клиенте по дате выполнения (новые сначала)
          items.sort((a, b) => {
            const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt);
            const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt);
            return dateB - dateA;
          });
          setWorkoutHistory(items);
        });
      } else {
        setUser(null);
        setWorkoutHistory(null);
        if (unsubscribe) unsubscribe();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  if (!user)
    return <p className="text-center mt-10">Please sign in to your account</p>;
  if (workoutHistory === null)
    return <p className="text-center mt-10">{TEXTS.en.common.loading}</p>;

  return (
    <>
      <Navigation currentPage="workout-history" user={user} />
      <div className="pt-20">
        <div className="max-w-[1200px] mx-auto p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">{TEXTS.en.workoutHistory.title}</h2>
        </div>

        {workoutHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">{TEXTS.en.workoutHistory.noHistory}</div>
            <div className="text-gray-500 text-sm mb-6">
              {TEXTS.en.workoutHistory.completeFirstWorkout}
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-blue-400 text-sm font-medium mb-2">
                🏃‍♂️ Start Training
              </div>
              <div className="text-gray-300 text-sm mb-4">
                {TEXTS.en.workoutHistory.completeFirstWorkout}
              </div>
              <button 
                onClick={() => window.location.href = '/workout-builder'}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-400 hover:to-purple-400 transition-all duration-300"
              >
                {TEXTS.en.workoutHistory.createWorkout}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {workoutHistory.map((session) => (
              <div
                key={session.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white text-xl font-semibold mb-1">
                      {session.workoutName}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {session.completedAt?.toDate ? 
                        session.completedAt.toDate().toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Recently'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm font-medium">
                      ✓ Completed
                    </div>
                  </div>
                </div>


                {/* Превью упражнений */}
                {session.exercises && session.exercises.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {session.exercises.slice(0, 4).map((exercise, index) => (
                      <div key={index} className="flex-shrink-0">
                        <video
                          className="w-16 h-16 rounded-lg object-cover"
                          autoPlay
                          muted
                          loop
                          playsInline
                        >
                          <source src={exercise.video} type="video/mp4" />
                        </video>
                      </div>
                    ))}
                    {session.exercises.length > 4 && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          +{session.exercises.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
