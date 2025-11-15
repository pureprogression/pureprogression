"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { auth, isAdmin, createWeeklyPlan, getAllWeeklyPlans, getUserIdByEmail, getAllUsers, updateWeeklyPlan, db } from "@/lib/firebase";
import { getDoc, doc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminWeeklyPlansPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const router = useRouter();
  const { language } = useLanguage();

  // Форма создания плана
  const [formData, setFormData] = useState({
    weekStartDate: new Date().toISOString().split('T')[0],
    goals: [''],
    days: Array(7).fill(null).map(() => ({ tasks: [{ id: `task_${Date.now()}_${Math.random()}`, text: '', completed: false, comments: [] }] }))
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (!isAdmin(u)) {
          router.push('/');
          return;
        }
        await loadPlans(u.uid);
        await loadUsers();
      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadPlans = async (adminUserId) => {
    try {
      const result = await getAllWeeklyPlans(adminUserId);
      if (result.success) {
        setPlans(result.plans);
      }
    } catch (error) {
      console.error("Ошибка при загрузке планов:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success) {
        setUsers(result.users);
      }
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setSelectedUser(null);
      return;
    }
    const result = await getUserIdByEmail(searchEmail.trim());
    if (result.success) {
      setSelectedUser({ id: result.userId, email: result.userData.email, displayName: result.userData.displayName });
    } else {
      alert(language === 'ru' ? 'Пользователь не найден' : 'User not found');
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  const handleAddGoal = () => {
    setFormData({
      ...formData,
      goals: [...formData.goals, '']
    });
  };

  const handleGoalChange = (index, value) => {
    const newGoals = [...formData.goals];
    newGoals[index] = value;
    setFormData({ ...formData, goals: newGoals });
  };

  const handleRemoveGoal = (index) => {
    const newGoals = formData.goals.filter((_, i) => i !== index);
    setFormData({ ...formData, goals: newGoals });
  };

  const handleAddTask = (dayIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].tasks.push({
      id: `task_${Date.now()}_${Math.random()}`,
      text: '',
      completed: false,
      comments: []
    });
    setFormData({ ...formData, days: newDays });
  };

  const handleTaskChange = (dayIndex, taskIndex, value) => {
    const newDays = [...formData.days];
    newDays[dayIndex].tasks[taskIndex].text = value;
    setFormData({ ...formData, days: newDays });
  };

  const handleRemoveTask = (dayIndex, taskIndex) => {
    const newDays = [...formData.days];
    newDays[dayIndex].tasks = newDays[dayIndex].tasks.filter((_, i) => i !== taskIndex);
    setFormData({ ...formData, days: newDays });
  };

  const handleEditPlan = async (plan) => {
    try {
      // Загружаем план для редактирования
      const planDoc = await getDoc(doc(db, 'weeklyPlans', plan.id));
      if (!planDoc.exists()) {
        alert(language === 'ru' ? 'План не найден' : 'Plan not found');
        return;
      }
      
      const planData = planDoc.data();
      
      // Находим пользователя по assignedUserId
      const assignedUser = users.find(u => u.id === planData.assignedUserId);
      if (assignedUser) {
        setSelectedUser({ id: assignedUser.id, email: assignedUser.email, displayName: assignedUser.displayName });
        setSearchEmail(assignedUser.email);
      }
      
      // Преобразуем дату из Timestamp в строку
      const weekStartDate = planData.weekStartDate?.toDate 
        ? planData.weekStartDate.toDate().toISOString().split('T')[0]
        : new Date(planData.weekStartDate?.seconds * 1000).toISOString().split('T')[0];
      
      // Заполняем форму данными плана
      setFormData({
        weekStartDate: weekStartDate,
        goals: planData.goals && planData.goals.length > 0 ? planData.goals : [''],
        days: planData.days && planData.days.length === 7 
          ? planData.days.map(day => ({
              tasks: day.tasks && day.tasks.length > 0 
                ? day.tasks 
                : [{ id: `task_${Date.now()}_${Math.random()}`, text: '', completed: false, comments: [] }],
              dayNotes: day.dayNotes || ''
            }))
          : Array(7).fill(null).map(() => ({ tasks: [{ id: `task_${Date.now()}_${Math.random()}`, text: '', completed: false, comments: [] }] }))
      });
      
      setEditingPlan(plan.id);
      setShowCreateForm(true);
    } catch (error) {
      console.error('Ошибка при загрузке плана:', error);
      alert(language === 'ru' ? 'Ошибка при загрузке плана' : 'Error loading plan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Минимальная валидация - только пользователь и дата обязательны
    if (!selectedUser) {
      alert(language === 'ru' ? 'Выберите пользователя' : 'Please select a user');
      return;
    }
    
    if (!formData.weekStartDate) {
      alert(language === 'ru' ? 'Выберите дату начала недели' : 'Please select week start date');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Фильтруем пустые задачи и цели (можно создать план даже без них)
      const filteredGoals = formData.goals.filter(g => g.trim());
      const filteredDays = formData.days.map(day => ({
        tasks: day.tasks.filter(t => t.text.trim()),
        dayNotes: day.dayNotes || ''
      }));

      if (editingPlan) {
        // Обновляем существующий план
        const weekStart = Timestamp.fromDate(new Date(formData.weekStartDate));
        const weekEnd = new Date(formData.weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndTimestamp = Timestamp.fromDate(weekEnd);

        // Обновляем дни с датами
        const days = [];
        for (let i = 0; i < 7; i++) {
          const dayDate = new Date(formData.weekStartDate);
          dayDate.setDate(dayDate.getDate() + i);
          days.push({
            dayNumber: i + 1,
            date: Timestamp.fromDate(dayDate),
            tasks: filteredDays[i]?.tasks || [],
            dayNotes: filteredDays[i]?.dayNotes || ''
          });
        }

        const result = await updateWeeklyPlan(editingPlan, {
          assignedUserId: selectedUser.id,
          weekStartDate: weekStart,
          weekEndDate: weekEndTimestamp,
          goals: filteredGoals,
          days: days
        });
        
        if (result.success) {
          alert(TEXTS[language].adminWeeklyPlans.planUpdated);
          setShowCreateForm(false);
          setEditingPlan(null);
          resetForm();
          await loadPlans(user.uid);
        } else {
          alert(TEXTS[language].adminWeeklyPlans.error + ': ' + result.error);
        }
      } else {
        // Создаем новый план
        const planData = {
          assignedUserId: selectedUser.id,
          createdBy: user.uid,
          weekStartDate: formData.weekStartDate,
          goals: filteredGoals,
          days: filteredDays
        };

        const result = await createWeeklyPlan(planData);
        if (result.success) {
          alert(TEXTS[language].adminWeeklyPlans.planCreated);
          setShowCreateForm(false);
          resetForm();
          await loadPlans(user.uid);
        } else {
          alert(TEXTS[language].adminWeeklyPlans.error + ': ' + result.error);
        }
      }
    } catch (error) {
      console.error('Ошибка при сохранении плана:', error);
      alert(TEXTS[language].adminWeeklyPlans.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      weekStartDate: new Date().toISOString().split('T')[0],
      goals: [''],
      days: Array(7).fill(null).map(() => ({ tasks: [{ id: `task_${Date.now()}_${Math.random()}`, text: '', completed: false, comments: [] }] }))
    });
    setSelectedUser(null);
    setSearchEmail('');
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingPlan(null);
    resetForm();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US');
  };

  if (isLoading) {
    return (
      <>
        <Navigation currentPage="admin" user={user} />
        <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
          <p className="text-white">{TEXTS[language].common.loading}</p>
        </div>
      </>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

  const dayNames = language === 'ru' 
    ? ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <>
      <Navigation currentPage="admin" user={user} />
      <div className="min-h-screen bg-black pt-20">
        <div className="max-w-[1400px] mx-auto p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{TEXTS[language].adminWeeklyPlans.title}</h2>
            <button
              onClick={() => {
                if (showCreateForm) {
                  handleCancelForm();
                } else {
                  setEditingPlan(null);
                  resetForm();
                  setShowCreateForm(true);
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-medium hover:from-yellow-400 hover:to-orange-400 transition-all"
            >
              {showCreateForm ? TEXTS[language].common.cancel : TEXTS[language].adminWeeklyPlans.createPlan}
            </button>
          </div>

          {/* Форма создания/редактирования плана */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingPlan ? TEXTS[language].adminWeeklyPlans.editPlan : TEXTS[language].adminWeeklyPlans.createPlan}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Выбор пользователя */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {TEXTS[language].adminWeeklyPlans.selectUser}
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchEmail}
                        onChange={(e) => {
                          setSearchEmail(e.target.value);
                          setSelectedUser(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearchUser();
                          }
                        }}
                        placeholder={TEXTS[language].adminWeeklyPlans.searchUser}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleSearchUser}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                      >
                        {language === 'ru' ? 'Найти' : 'Search'}
                      </button>
                    </div>
                    
                    {selectedUser && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                        <p className="text-green-400 text-sm">
                          {language === 'ru' ? 'Выбран:' : 'Selected:'} {selectedUser.displayName || selectedUser.email}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(null);
                            setSearchEmail('');
                          }}
                          className="text-xs text-red-400 hover:text-red-300 mt-1"
                        >
                          {language === 'ru' ? 'Отменить выбор' : 'Clear selection'}
                        </button>
                      </div>
                    )}

                    {!selectedUser && searchEmail && filteredUsers.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-lg max-h-48 overflow-y-auto">
                        {filteredUsers.slice(0, 10).map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser({ id: user.id, email: user.email, displayName: user.displayName });
                              setSearchEmail(user.email);
                            }}
                            className="w-full text-left p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                          >
                            <p className="text-white text-sm">{user.displayName || user.email}</p>
                            {user.displayName && (
                              <p className="text-gray-400 text-xs">{user.email}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Дата начала недели */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {TEXTS[language].adminWeeklyPlans.weekStartDate}
                  </label>
                  <input
                    type="date"
                    value={formData.weekStartDate}
                    onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:border-yellow-500/50"
                    required
                  />
                </div>

                {/* Цели недели */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    {TEXTS[language].adminWeeklyPlans.weekGoals}
                  </label>
                  {formData.goals.map((goal, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={goal}
                        onChange={(e) => handleGoalChange(index, e.target.value)}
                        placeholder={`${TEXTS[language].adminWeeklyPlans.goal} ${index + 1}`}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500/50"
                      />
                      {formData.goals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(index)}
                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          {TEXTS[language].common.delete}
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="mt-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                  >
                    + {TEXTS[language].adminWeeklyPlans.addGoal}
                  </button>
                </div>

                {/* Задачи по дням */}
                <div>
                  <label className="block text-white text-sm font-medium mb-4">
                    {TEXTS[language].weeklyPlan.tasks} {TEXTS[language].adminWeeklyPlans.day.toLowerCase()}
                  </label>
                  <div className="space-y-4">
                    {formData.days.map((day, dayIndex) => (
                      <div key={dayIndex} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <h4 className="text-white font-medium mb-3">
                          {TEXTS[language].adminWeeklyPlans.day} {dayIndex + 1} - {dayNames[dayIndex]}
                        </h4>
                        <div className="space-y-2">
                          {day.tasks.map((task, taskIndex) => (
                            <div key={task.id} className="flex gap-2">
                              <input
                                type="text"
                                value={task.text}
                                onChange={(e) => handleTaskChange(dayIndex, taskIndex, e.target.value)}
                                placeholder={TEXTS[language].adminWeeklyPlans.taskText}
                                className="flex-1 bg-white/10 border border-white/20 rounded-lg p-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-yellow-500/50"
                              />
                              {day.tasks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTask(dayIndex, taskIndex)}
                                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                >
                                  {TEXTS[language].common.delete}
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddTask(dayIndex)}
                            className="w-full px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                          >
                            + {TEXTS[language].adminWeeklyPlans.addTask}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-medium hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? TEXTS[language].common.loading : TEXTS[language].adminWeeklyPlans.savePlan}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    {TEXTS[language].common.cancel}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Список планов */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">{TEXTS[language].adminWeeklyPlans.allPlans}</h3>
            {plans.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 text-center">
                <p className="text-gray-400">{TEXTS[language].adminWeeklyPlans.noPlans}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div key={plan.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        plan.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {plan.status === 'active' ? TEXTS[language].weeklyPlan.active : TEXTS[language].weeklyPlan.completed}
                      </span>
                    </div>
                    <p className="text-white font-medium mb-1">
                      {TEXTS[language].adminWeeklyPlans.assignedTo}: {(() => {
                        const assignedUser = users.find(u => u.id === plan.assignedUserId);
                        return assignedUser?.displayName || assignedUser?.email || plan.assignedUserId;
                      })()}
                      {users.find(u => u.id === plan.assignedUserId)?.email && !users.find(u => u.id === plan.assignedUserId)?.displayName && (
                        <span className="text-gray-400 text-xs ml-2">
                          ({users.find(u => u.id === plan.assignedUserId).email})
                        </span>
                      )}
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      {formatDate(plan.weekStartDate)} - {formatDate(plan.weekEndDate)}
                    </p>
                    <p className="text-gray-400 text-xs mb-3">
                      {TEXTS[language].adminWeeklyPlans.createdAt}: {formatDate(plan.createdAt)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingPlan(plan)}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        {TEXTS[language].adminWeeklyPlans.viewPlan}
                      </button>
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm"
                      >
                        {TEXTS[language].adminWeeklyPlans.editPlan}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно просмотра плана */}
      {viewingPlan && (
        <PlanViewModal 
          plan={viewingPlan} 
          users={users}
          onClose={() => setViewingPlan(null)}
          language={language}
        />
      )}
    </>
  );
}

// Компонент модального окна для просмотра плана
function PlanViewModal({ plan, users, onClose, language }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US');
  };

  const assignedUser = users.find(u => u.id === plan.assignedUserId);
  const dayNames = language === 'ru' 
    ? ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
      <motion.div
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === 'ru' ? 'Просмотр плана' : 'Plan View'}
              </h2>
              <p className="text-gray-400 text-sm">
                {language === 'ru' ? 'Назначено:' : 'Assigned to:'} {assignedUser?.displayName || assignedUser?.email || plan.assignedUserId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {/* Цели недели */}
          {plan.goals && plan.goals.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <h3 className="text-white font-semibold mb-3">
                {language === 'ru' ? 'Цели недели' : 'Week Goals'}
              </h3>
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

          {/* Дни недели */}
          <div className="space-y-4">
            {plan.days && plan.days.map((day, dayIndex) => {
              const completedTasks = day.tasks?.filter(t => t.completed === true).length || 0;
              const failedTasks = day.tasks?.filter(t => t.completed === false).length || 0;
              const totalTasks = day.tasks?.length || 0;
              
              return (
                <div key={dayIndex} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-semibold">
                        {language === 'ru' ? 'День' : 'Day'} {day.dayNumber} - {dayNames[dayIndex]}
                      </h4>
                      <p className="text-gray-400 text-sm">{formatDate(day.date)}</p>
                    </div>
                    {totalTasks > 0 && (
                      <span className="text-gray-400 text-sm">
                        <span className="text-green-400">{completedTasks}</span> / 
                        <span className="text-red-400 mx-1">{failedTasks}</span> / 
                        <span className="text-gray-400">{totalTasks}</span>
                      </span>
                    )}
                  </div>

                  {/* Задачи */}
                  {day.tasks && day.tasks.length > 0 ? (
                    <div className="space-y-3">
                      {day.tasks.map((task) => (
                        <div key={task.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                              task.completed === true
                                ? 'bg-green-500 border-green-500'
                                : task.completed === false
                                ? 'bg-red-500 border-red-500'
                                : 'border-gray-400'
                            }`}>
                              {task.completed === true && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              {task.completed === false && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${
                                task.completed === true 
                                  ? 'text-green-400 line-through' 
                                  : task.completed === false
                                  ? 'text-red-400'
                                  : 'text-white'
                              }`}>
                                {task.text}
                              </p>
                              
                              {/* Комментарии пользователя */}
                              {task.comments && task.comments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-gray-400 font-medium">
                                    {language === 'ru' ? 'Комментарии пользователя:' : 'User comments:'}
                                  </p>
                                  {task.comments.map((comment, commentIdx) => (
                                    <div key={commentIdx} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                                      <p className="text-xs text-blue-300 mb-1">{comment.text}</p>
                                      {comment.createdAt && (
                                        <p className="text-xs text-gray-500">
                                          {formatDateTime(comment.createdAt)}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-2">
                      {language === 'ru' ? 'Нет задач' : 'No tasks'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
    </AnimatePresence>,
    document.body
  );
}

