"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, getActiveWeeklyPlan, completeWeeklyPlan } from "@/lib/firebase";
import { onAuthStateChanged, onSnapshot } from "firebase/auth";
import { collection, query, where, onSnapshot as onFirestoreSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navigation from "@/components/Navigation";
import WeeklyPlanCard from "@/components/WeeklyPlanCard";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

export default function WeeklyPlanPage() {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadPlan(u.uid);
        // Подписываемся на real-time обновления
        subscribeToPlan(u.uid);
      } else {
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Нормализуем план: преобразуем completed: false в null для задач, которые еще не были изменены
  const normalizePlan = (plan) => {
    if (!plan || !plan.days) return plan;
    
    const normalizeTasks = (tasks) => {
      if (!tasks) return [];
      return tasks.map(task => {
        // Если completed === false и нет меток времени (задача не была изменена пользователем),
        // преобразуем в null
        if (task.completed === false && !task.completedAt && !task.failedAt) {
          return {
            ...task,
            completed: null
          };
        }
        return task;
      });
    };
    
    const normalizedDays = plan.days.map(day => {
      const normalizedDay = { ...day };
      
      // Нормализуем новую структуру (morningTasks/dayTasks/eveningTasks)
      if (day.morningTasks || day.dayTasks || day.eveningTasks) {
        normalizedDay.morningTasks = normalizeTasks(day.morningTasks);
        normalizedDay.dayTasks = normalizeTasks(day.dayTasks);
        normalizedDay.eveningTasks = normalizeTasks(day.eveningTasks);
      } else {
        // Нормализуем старую структуру (tasks)
        normalizedDay.tasks = normalizeTasks(day.tasks);
      }
      
      return normalizedDay;
    });
    
    return {
      ...plan,
      days: normalizedDays
    };
  };

  const loadPlan = async (userId) => {
    try {
      setIsLoading(true);
      const result = await getActiveWeeklyPlan(userId);
      if (result.success && result.plan) {
        setPlan(normalizePlan(result.plan));
      }
    } catch (error) {
      console.error("Ошибка при загрузке плана:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPlan = (userId) => {
    const plansRef = collection(db, 'weeklyPlans');
    const q = query(
      plansRef,
      where('assignedUserId', '==', userId),
      where('status', '==', 'active')
    );

    return onFirestoreSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const planDoc = snapshot.docs[0];
        const planData = { id: planDoc.id, ...planDoc.data() };
        setPlan(normalizePlan(planData));
      } else {
        setPlan(null);
      }
      setIsLoading(false);
    });
  };

  const handleCompleteWeek = async () => {
    if (!plan || !window.confirm(language === 'ru' ? 'Завершить неделю?' : 'Complete the week?')) {
      return;
    }
    setIsCompleting(true);
    const result = await completeWeeklyPlan(plan.id);
    if (result.success) {
      setPlan(null);
      alert(language === 'ru' ? 'Неделя завершена!' : 'Week completed!');
    } else {
      console.error('Ошибка при завершении недели:', result.error);
      alert(language === 'ru' ? 'Ошибка при завершении недели' : 'Error completing week');
    }
    setIsCompleting(false);
  };

  const getCurrentDayIndex = () => {
    if (!plan || !plan.days) return -1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < plan.days.length; i++) {
      const dayDate = plan.days[i].date?.toDate ? plan.days[i].date.toDate() : new Date(plan.days[i].date);
      dayDate.setHours(0, 0, 0, 0);
      if (dayDate.getTime() === today.getTime()) {
        return i;
      }
    }
    return -1;
  };

  const calculateOverallProgress = () => {
    if (!plan || !plan.days) return { completed: 0, failed: 0, total: 0, percentage: 0 };
    let totalTasks = 0;
    let completedTasks = 0;
    let failedTasks = 0;
    
    plan.days.forEach(day => {
      if (day.tasks) {
        totalTasks += day.tasks.length;
        completedTasks += day.tasks.filter(t => t.completed === true).length;
        failedTasks += day.tasks.filter(t => t.completed === false).length;
      }
    });
    
    return {
      completed: completedTasks,
      failed: failedTasks,
      total: totalTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  if (isLoading) {
    return (
      <>
        <Navigation currentPage="weekly-plan" user={user} />
        <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
          <p className="text-white">{TEXTS[language].common.loading}</p>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  if (!plan) {
    return (
      <>
        <Navigation currentPage="weekly-plan" user={user} />
        <div className="min-h-screen bg-black pt-20">
          <div className="max-w-[1200px] mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6 text-white">{TEXTS[language].weeklyPlan.title}</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center">
              <p className="text-gray-400 mb-2">{TEXTS[language].weeklyPlan.noPlan}</p>
              <p className="text-gray-500 text-sm">{TEXTS[language].weeklyPlan.waitingForPlan}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currentDayIndex = getCurrentDayIndex();
  const progress = calculateOverallProgress();

  return (
    <>
      <Navigation currentPage="weekly-plan" user={user} />
      <div className="min-h-screen bg-black pt-20">
        <div className="max-w-[1200px] mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{TEXTS[language].weeklyPlan.title}</h2>
            <button
              onClick={handleCompleteWeek}
              disabled={isCompleting}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-medium hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isCompleting ? TEXTS[language].common.loading : TEXTS[language].weeklyPlan.completeWeek}
            </button>
          </div>

          {/* Общий прогресс */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">{TEXTS[language].weeklyPlan.progress}</h3>
              <span className="text-yellow-400 font-bold">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full"
              />
            </div>
            <p className="text-gray-400 text-sm">
              <span className="text-green-400">{progress.completed}</span> {language === 'ru' ? 'выполнено' : 'completed'} / 
              <span className="text-red-400 mx-1">{progress.failed}</span> {language === 'ru' ? 'не выполнено' : 'not completed'} / 
              <span className="text-gray-400">{progress.total}</span> {language === 'ru' ? 'всего' : 'total'}
            </p>
          </div>

          {/* Цели недели */}
          {plan.goals && plan.goals.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6">
              <h3 className="text-white font-semibold mb-3">{TEXTS[language].weeklyPlan.weekGoals}</h3>
              <ul className="space-y-2">
                {plan.goals.map((goal, idx) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Карточки дней */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.days && plan.days.map((day, index) => (
              <WeeklyPlanCard
                key={index}
                day={day}
                dayIndex={index}
                planId={plan.id}
                userId={user.uid}
                isCurrentDay={index === currentDayIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

