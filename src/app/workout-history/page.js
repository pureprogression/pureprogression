"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import Navigation from "@/components/Navigation";

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
    return <p className="text-center mt-10">Пожалуйста, войдите в аккаунт</p>;
  if (workoutHistory === null)
    return <p className="text-center mt-10">Загрузка...</p>;

  return (
    <>
      <Navigation currentPage="workout-history" user={user} />
      <div className="max-w-[1200px] mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">История тренировок</h2>
        </div>

        {workoutHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">У вас пока нет истории тренировок</div>
            <div className="text-gray-500 text-sm mb-6">
              Выполните свою первую тренировку, чтобы отслеживать прогресс
            </div>
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-yellow-400 text-sm font-medium mb-2">
                🔒 Премиум функция
              </div>
              <div className="text-gray-300 text-sm mb-4">
                Отслеживание истории тренировок доступно с премиум подпиской
              </div>
              <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 px-4 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-400 transition-all duration-300">
                Попробовать бесплатно
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
                        session.completedAt.toDate().toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 
                        'Недавно'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 text-sm font-medium">
                      ✓ Завершено
                    </div>
                    <div className="text-gray-500 text-xs">
                      {session.duration ? `${session.duration} мин` : 'Время не указано'}
                    </div>
                  </div>
                </div>

                {/* Статистика выполнения */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-semibold">
                      {session.exercises?.length || 0}
                    </div>
                    <div className="text-gray-400 text-xs">Упражнений</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-semibold">
                      {session.totalSets || 0}
                    </div>
                    <div className="text-gray-400 text-xs">Подходов</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-semibold">
                      {session.totalReps || 0}
                    </div>
                    <div className="text-gray-400 text-xs">Повторений</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <div className="text-white text-lg font-semibold">
                      {session.caloriesBurned || 0}
                    </div>
                    <div className="text-gray-400 text-xs">Ккал</div>
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
    </>
  );
}
