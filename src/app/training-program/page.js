"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import LazyVideo from "@/components/LazyVideo";
import { motion } from "framer-motion";

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_NAMES_RU_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export default function TrainingProgramPage() {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [mounted, setMounted] = useState(false);
  const scrollPositionRef = useRef(0);
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Блокируем скролл body когда открыто модальное окно и сохраняем позицию
  useEffect(() => {
    if (selectedExercise) {
      // Сохраняем текущую позицию скролла
      scrollPositionRef.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      
      // Блокируем скролл и фиксируем позицию
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.top = `-${scrollPositionRef.current}px`;
      document.documentElement.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = '100%';
    } else {
      // Восстанавливаем скролл и позицию
      const scrollY = scrollPositionRef.current;
      
      document.documentElement.style.overflow = '';
      document.documentElement.style.position = '';
      document.documentElement.style.top = '';
      document.documentElement.style.width = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Восстанавливаем позицию скролла
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
    
    return () => {
      // Очистка при размонтировании
      if (!selectedExercise) {
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.top = '';
        document.documentElement.style.width = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
      }
    };
  }, [selectedExercise]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        subscribeToPlan(u.uid);
      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const subscribeToPlan = (userId) => {
    const plansRef = collection(db, 'trainingPrograms');
    const q = query(
      plansRef,
      where('assignedUserId', '==', userId),
      where('status', '==', 'active')
    );

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const planDoc = snapshot.docs[0];
        const planData = { id: planDoc.id, ...planDoc.data() };
        setPlan(planData);
        // Устанавливаем текущий день при загрузке
        const currentDay = getCurrentDayIndex(planData);
        if (currentDay >= 0) {
          setSelectedDayIndex(currentDay);
        }
      } else {
        setPlan(null);
      }
      setIsLoading(false);
    });
  };

  const getCurrentDayIndex = (planData) => {
    if (!planData || !planData.days) return -1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < planData.days.length; i++) {
      const dayDate = planData.days[i].date?.toDate ? planData.days[i].date.toDate() : new Date(planData.days[i].date);
      dayDate.setHours(0, 0, 0, 0);
      if (dayDate.getTime() === today.getTime()) {
        return i;
      }
    }
    return -1; // Возвращаем -1 если текущий день не найден
  };

  // Определяем статус дня (прошедший/текущий/будущий)
  const getDayStatus = (dayDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = dayDate?.toDate ? dayDate.toDate() : new Date(dayDate);
    date.setHours(0, 0, 0, 0);
    
    if (date.getTime() < today.getTime()) return 'past';
    if (date.getTime() === today.getTime()) return 'today';
    return 'future';
  };


  if (isLoading) {
    return (
      <>
        <Navigation currentPage="training-program" user={user} />
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
        <Navigation currentPage="training-program" user={user} />
        <div className="min-h-screen bg-black pt-20">
          <div className="max-w-[1200px] mx-auto p-4">
            <h2 className="text-2xl font-bold mb-6 text-white">
              {TEXTS[language].trainingProgram.title}
            </h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center">
              <p className="text-gray-400 mb-2">
                {language === 'ru' 
                  ? 'У вас пока нет активной программы тренировок' 
                  : 'You don\'t have an active training program yet'}
              </p>
              <p className="text-gray-500 text-sm">
                {language === 'ru' 
                  ? 'Ваш тренер скоро создаст для вас персональную программу' 
                  : 'Your coach will create a personalized program for you soon'}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const dayNamesShort = language === 'ru' ? DAY_NAMES_RU : DAY_NAMES;
  const dayNamesFull = language === 'ru' ? DAY_NAMES_RU_FULL : DAY_NAMES_FULL;
  const currentDayIndex = getCurrentDayIndex(plan);
  const selectedDay = plan.days?.[selectedDayIndex];

  return (
    <>
      <Navigation currentPage="training-program" user={user} />
      <div className="min-h-screen bg-black pt-20 pb-8">
        <div className="max-w-[1400px] mx-auto px-4">
          {/* Заголовок */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-4 text-white">
              {TEXTS[language].trainingProgram.title}
            </h1>
          </div>

          {/* Цель тренировок */}
          {plan.programGoal && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6">
              <h3 className="text-white font-semibold mb-2 text-sm">
                {language === 'ru' ? 'Цель программы' : 'Program Goal'}
              </h3>
              <p className="text-white/80 text-sm">{plan.programGoal}</p>
            </div>
          )}

          {/* Цели недели - компактно */}
          {plan.goals && plan.goals.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6">
              <h3 className="text-white font-semibold mb-2 text-sm">
                {TEXTS[language].trainingProgram.weekGoals}
              </h3>
              <div className="flex flex-wrap gap-2">
                {plan.goals.map((goal, idx) => (
                  <span key={idx} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Навигация по дням - фиксированная с заголовком */}
          <div className="fixed top-20 left-0 right-0 z-30 bg-black/95 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-[1400px] mx-auto px-4">
              {/* Заголовок над календарем */}
              <div className="pt-4 pb-3">
                <h2 className="text-xl font-bold text-white">
                  {language === 'ru' ? 'Программа тренировок' : 'Training Program'}
                </h2>
              </div>
              {/* Календарь дней */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
              {plan.days && plan.days.map((day, dayIndex) => {
                const dayDate = day.date?.toDate ? day.date.toDate() : new Date(day.date);
                const dateStr = dayDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                  day: 'numeric',
                  month: 'short'
                });
                const isCurrentDay = dayIndex === currentDayIndex;
                const isSelected = dayIndex === selectedDayIndex;
                const workoutsCount = day.workouts?.length || 0;
                const dayStatus = getDayStatus(day.date);

                return (
                  <button
                    key={dayIndex}
                    onClick={() => setSelectedDayIndex(dayIndex)}
                    className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all relative ${
                      isSelected
                        ? 'bg-yellow-500 text-black'
                        : isCurrentDay
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : dayStatus === 'past'
                        ? 'bg-white/5 text-white/60 hover:bg-white/10 opacity-80'
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xs font-medium mb-1">{dayNamesShort[dayIndex]}</div>
                      <div className="text-lg font-bold">{dayDate.getDate()}</div>
                      {workoutsCount > 0 && (
                        <div className={`text-xs mt-1 ${isSelected ? 'text-black/60' : dayStatus === 'past' ? 'text-white/40' : 'text-white/60'}`}>
                          {workoutsCount} {language === 'ru' ? 'упр.' : 'ex.'}
                        </div>
                      )}
                      {/* Индикатор прошедшего дня */}
                      {dayStatus === 'past' && !isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                      )}
                    </div>
                  </button>
                );
              })}
              </div>
            </div>
          </div>
          
          {/* Отступ для фиксированного календаря с заголовком */}
          <div className="h-32 mb-6"></div>

          {/* Контент выбранного дня */}
          {selectedDay && (
            <motion.div
              key={selectedDayIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6"
            >
              {/* Заголовок дня */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {dayNamesFull[selectedDayIndex]}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {(() => {
                        const dayDate = selectedDay.date?.toDate ? selectedDay.date.toDate() : new Date(selectedDay.date);
                        return dayDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        });
                      })()}
                    </p>
                  </div>
                  {selectedDayIndex === currentDayIndex && (
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                      ● {language === 'ru' ? 'Сегодня' : 'Today'}
                    </span>
                  )}
                </div>
                {selectedDay.dayTitle && (
                  <h3 className="text-lg font-semibold text-white mt-2">{selectedDay.dayTitle}</h3>
                )}
                {selectedDay.dayGoal && (
                  <p className="text-gray-300 text-sm mt-1">{selectedDay.dayGoal}</p>
                )}
              </div>

              {/* Упражнения - список с текстом слева и видео справа */}
              {selectedDay.workouts && Array.isArray(selectedDay.workouts) && selectedDay.workouts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {language === 'ru' ? 'Упражнения' : 'Exercises'} ({selectedDay.workouts.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedDay.workouts.map((exercise, exIndex) => (
                      <motion.div
                        key={exercise.id || exIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: exIndex * 0.05 }}
                        className={`bg-white/5 rounded-xl p-5 hover:bg-white/10 transition-all ${
                          !exercise.isTextExercise && exercise.exercise?.video ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => {
                          if (!exercise.isTextExercise && exercise.exercise?.video) {
                            setSelectedExercise(exercise);
                          }
                        }}
                      >
                        <div className="flex gap-6 items-start">
                          {/* Левая часть - текст */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-semibold text-white mb-3">
                              {exercise.isTextExercise 
                                ? (exercise.exerciseName || (language === 'ru' ? 'Текстовое упражнение' : 'Text Exercise'))
                                : (exercise.exercise?.title || 'Exercise')
                              }
                            </h4>
                            
                            {/* Подходы и повторения */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">{language === 'ru' ? 'Подходы:' : 'Sets:'}</span>
                                <span className="text-white font-medium">{exercise.sets || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-white/60 text-sm">{language === 'ru' ? 'Повторения:' : 'Reps:'}</span>
                                <span className="text-white font-medium">{exercise.reps || 0}</span>
                              </div>
                            </div>

                            {/* Заметки */}
                            {exercise.notes && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-white/80 text-sm leading-relaxed">{exercise.notes}</p>
                              </div>
                            )}
                          </div>

                          {/* Правая часть - видео (только если есть) */}
                          {!exercise.isTextExercise && exercise.exercise?.video && (
                            <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-black">
                              <LazyVideo
                                src={exercise.exercise.video}
                                poster={exercise.exercise.poster}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Текстовые задачи - компактно */}
              {selectedDay.tasks && selectedDay.tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {language === 'ru' ? 'Задачи' : 'Tasks'}
                  </h3>
                  <div className="space-y-2">
                    {selectedDay.tasks.map((task, taskIndex) => (
                      <div
                        key={task.id || taskIndex}
                        className="bg-white/5 rounded-lg p-3 flex items-start gap-3"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          task.completed === true 
                            ? 'bg-green-500 border-green-500' 
                            : task.completed === false
                            ? 'bg-red-500 border-red-500'
                            : 'border-white/30'
                        }`}>
                          {task.completed === true && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {task.completed === false && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </div>
                        <p className={`text-white flex-1 text-sm ${
                          task.completed === true ? 'line-through text-white/50' : ''
                        }`}>
                          {task.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Пустое состояние */}
              {(!selectedDay.workouts || selectedDay.workouts.length === 0) && (!selectedDay.tasks || selectedDay.tasks.length === 0) && (
                <div className="text-center py-12">
                  <p className="text-white/40 text-sm">
                    {language === 'ru' 
                      ? 'На этот день упражнения не назначены' 
                      : 'No exercises assigned for this day'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Модальное окно через Portal */}
      {mounted && selectedExercise && !selectedExercise.isTextExercise && selectedExercise.exercise?.video && createPortal(
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            padding: 0
          }}
          onClick={() => setSelectedExercise(null)}
        >
          {/* Видео контейнер */}
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={selectedExercise.exercise.video}
              poster={selectedExercise.exercise.poster}
              autoPlay
              loop
              muted
              playsInline
              controls
              style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          </div>
          
          {/* Кнопка закрытия - маленькая и лаконичная */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedExercise(null);
            }}
            style={{
              position: 'fixed',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.9)',
              cursor: 'pointer',
              zIndex: 10000,
              transition: 'all 0.2s ease',
              border: 'none',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Close"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Информация об упражнении внизу */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.8), transparent)',
              padding: '24px',
              zIndex: 10000
            }}
          >
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
              {selectedExercise.exercise?.title || 'Exercise'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              <span>{selectedExercise.sets || 0} {language === 'ru' ? 'подходов' : 'sets'}</span>
              <span>×</span>
              <span>{selectedExercise.reps || 0} {language === 'ru' ? 'повторений' : 'reps'}</span>
            </div>
            {selectedExercise.notes && (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '8px' }}>
                {selectedExercise.notes}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
