"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateTaskStatus, addTaskComment } from "@/lib/firebase";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

export default function WeeklyPlanCard({ day, dayIndex, planId, userId, isCurrentDay = false }) {
  const [expandedTask, setExpandedTask] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language } = useLanguage();

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const handleTaskStatusChange = async (taskId, newStatus) => {
    // newStatus: true (выполнено), false (не выполнено), null (не отмечено)
    setIsSubmitting(true);
    const result = await updateTaskStatus(planId, dayIndex, taskId, newStatus);
    if (result.success) {
      setIsSubmitting(false);
    } else {
      console.error('Ошибка при обновлении задачи:', result.error);
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (taskId) => {
    if (!commentText[taskId] || !commentText[taskId].trim()) return;
    setIsSubmitting(true);
    const result = await addTaskComment(planId, dayIndex, taskId, commentText[taskId], userId);
    if (result.success) {
      setCommentText({ ...commentText, [taskId]: '' });
      setExpandedTask(null);
      setIsSubmitting(false);
    } else {
      console.error('Ошибка при добавлении комментария:', result.error);
      setIsSubmitting(false);
    }
  };

  const completedTasks = day.tasks?.filter(t => t.completed === true).length || 0;
  const failedTasks = day.tasks?.filter(t => t.completed === false).length || 0;
  const totalTasks = day.tasks?.length || 0;
  const markedTasks = completedTasks + failedTasks; // Все отмеченные задачи
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border ${
        isCurrentDay ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20' : 'border-white/10'
      }`}
    >
      {/* Заголовок дня */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg">
            {TEXTS[language].weeklyPlan.day} {day.dayNumber}
            {day.dayTitle && (
              <span className="ml-2 text-yellow-400 font-normal text-base">
                • {day.dayTitle}
              </span>
            )}
          </h3>
          <p className="text-gray-400 text-sm">{formatDate(day.date)}</p>
        </div>
        {isCurrentDay && (
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
            {TEXTS[language].weeklyPlan.active}
          </span>
        )}
      </div>

      {/* Прогресс */}
      {totalTasks > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>
              <span className="text-green-400">{completedTasks}</span> / 
              <span className="text-red-400 mx-1">{failedTasks}</span> / 
              <span className="text-gray-400">{totalTasks}</span> {TEXTS[language].weeklyPlan.ofTasksCompleted}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Задачи */}
      <div className="space-y-2">
        {day.tasks && day.tasks.length > 0 ? (
          day.tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white/5 rounded-lg p-3 border border-white/5"
            >
              <div className="flex items-start gap-3">
                {/* Кнопки выбора статуса */}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => !isSubmitting && handleTaskStatusChange(task.id, true)}
                    disabled={isSubmitting}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                      task.completed === true
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-green-500/20 hover:text-green-400'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={language === 'ru' ? 'Выполнено' : 'Completed'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => !isSubmitting && handleTaskStatusChange(task.id, false)}
                    disabled={isSubmitting}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                      task.completed === false
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-red-500/20 hover:text-red-400'
                    } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={language === 'ru' ? 'Не выполнено' : 'Not completed'}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm flex-1 ${
                        task.completed === true 
                          ? 'text-green-400 line-through' 
                          : task.completed === false
                          ? 'text-red-400'
                          : 'text-white'
                      }`}
                    >
                      {task.text}
                    </p>
                    
                    {/* Кнопка добавить комментарий */}
                    {expandedTask !== task.id && (
                      <button
                        onClick={() => setExpandedTask(task.id)}
                        className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors whitespace-nowrap"
                      >
                        {TEXTS[language].weeklyPlan.addComment}
                      </button>
                    )}
                  </div>
                  
                  {/* Комментарии */}
                  {task.comments && task.comments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {task.comments.map((comment, idx) => (
                        <div key={idx} className="text-xs text-gray-400 bg-white/5 rounded p-2">
                          {comment.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Форма добавления комментария */}
                  {expandedTask === task.id && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={commentText[task.id] || ''}
                        onChange={(e) => setCommentText({ ...commentText, [task.id]: e.target.value })}
                        placeholder={TEXTS[language].weeklyPlan.comment}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-yellow-500/50"
                        rows="2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddComment(task.id)}
                          disabled={isSubmitting || !commentText[task.id]?.trim()}
                          className="px-3 py-1 bg-yellow-500 text-black text-xs rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {TEXTS[language].weeklyPlan.saveComment}
                        </button>
                        <button
                          onClick={() => {
                            setExpandedTask(null);
                            setCommentText({ ...commentText, [task.id]: '' });
                          }}
                          className="px-3 py-1 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-colors"
                        >
                          {TEXTS[language].common.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">
            {TEXTS[language].weeklyPlan.tasks} {TEXTS[language].common.loading.toLowerCase()}
          </p>
        )}
      </div>
    </motion.div>
  );
}

