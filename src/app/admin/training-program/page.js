"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, isAdmin, getAllUsers, getUserIdByEmail, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs, updateDoc, doc, deleteDoc, orderBy } from "firebase/firestore";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { exercises } from "@/data/exercises";
import ExercisesFilter from "@/components/ExercisesFilter";
import LazyVideo from "@/components/LazyVideo";
import { motion } from "framer-motion";

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

export default function TrainingProgramPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0); // активный день для добавления упражнений
  const [programs, setPrograms] = useState([]); // список существующих программ
  const [editingProgramId, setEditingProgramId] = useState(null); // ID редактируемой программы
  const [showProgramsList, setShowProgramsList] = useState(false); // показывать ли список программ
  const router = useRouter();
  const { language } = useLanguage();

  // Форма программы
  const [formData, setFormData] = useState({
    weekStartDate: new Date().toISOString().split('T')[0],
    goals: [''],
    days: Array(7).fill(null).map(() => ({
      dayTitle: '',
      dayGoal: '',
      workouts: [], // упражнения с видео и текстовые
      tasks: [] // текстовые задачи
    }))
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (!isAdmin(u)) {
          router.push('/');
          return;
        }
        await loadUsers();
        await loadPrograms();
      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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

  const loadPrograms = async () => {
    try {
      const programsRef = collection(db, 'trainingPrograms');
      const q = query(programsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const programsList = [];
      snapshot.forEach((doc) => {
        programsList.push({ id: doc.id, ...doc.data() });
      });
      setPrograms(programsList);
    } catch (error) {
      console.error("Ошибка при загрузке программ:", error);
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) {
      setSelectedUser(null);
      return;
    }

    setIsSearchingUser(true);
    try {
      const result = await getUserIdByEmail(searchEmail.trim());
      if (result.success) {
        setSelectedUser({ 
          id: result.userId, 
          email: result.userData?.email || searchEmail.trim(), 
          displayName: result.userData?.displayName || '',
          ...result.userData 
        });
      } else {
        alert(language === 'ru' ? `Пользователь не найден: ${result.error || 'Unknown error'}` : `User not found: ${result.error || 'Unknown error'}`);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Ошибка при поиске пользователя:', error);
      alert(language === 'ru' ? `Ошибка при поиске пользователя: ${error.message}` : `Error searching for user: ${error.message}`);
      setSelectedUser(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Фильтрация упражнений
  const filteredExercises = exercises.filter(exercise => {
    if (selectedCategory === "All") return true;
    return exercise.muscleGroups.includes(selectedCategory);
  });

  // Добавление упражнения в день
  const addExerciseToDay = (dayIndex, exercise) => {
    const newExercise = {
      id: `ex_${Date.now()}_${Math.random()}`,
      exerciseId: exercise.id,
      exercise: exercise,
      sets: 3,
      reps: 12,
      notes: ''
    };

    setFormData(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        workouts: [...newDays[dayIndex].workouts, newExercise]
      };
      return { ...prev, days: newDays };
    });
  };

  // Добавление текстового упражнения
  const addTextExerciseToDay = (dayIndex) => {
    const newExercise = {
      id: `text_${Date.now()}_${Math.random()}`,
      isTextExercise: true,
      exerciseName: '',
      sets: 3,
      reps: 12,
      notes: ''
    };

    setFormData(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        workouts: [...newDays[dayIndex].workouts, newExercise]
      };
      return { ...prev, days: newDays };
    });
  };

  // Удаление упражнения
  const removeExercise = (dayIndex, exerciseId) => {
    setFormData(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        workouts: newDays[dayIndex].workouts.filter(ex => ex.id !== exerciseId)
      };
      return { ...prev, days: newDays };
    });
  };

  // Обновление упражнения
  const updateExercise = (dayIndex, exerciseId, field, value) => {
    setFormData(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        workouts: newDays[dayIndex].workouts.map(ex =>
          ex.id === exerciseId ? { ...ex, [field]: value } : ex
        )
      };
      return { ...prev, days: newDays };
    });
  };

  // Добавление текстовой задачи
  const addTask = (dayIndex) => {
    const newTask = {
      id: `task_${Date.now()}_${Math.random()}`,
      text: '',
      completed: null,
      comments: []
    };

    setFormData(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        tasks: [...newDays[dayIndex].tasks, newTask]
      };
      return { ...prev, days: newDays };
    });
  };

  // Обновление задачи
  const updateTask = (dayIndex, taskId, field, value) => {
    setFormData(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        tasks: newDays[dayIndex].tasks.map(task =>
          task.id === taskId ? { ...task, [field]: value } : task
        )
      };
      return { ...prev, days: newDays };
    });
  };

  // Удаление задачи
  const removeTask = (dayIndex, taskId) => {
    setFormData(prev => {
      const newDays = [...prev.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        tasks: newDays[dayIndex].tasks.filter(task => task.id !== taskId)
      };
      return { ...prev, days: newDays };
    });
  };

  // Обновление целей
  const updateGoals = (index, value) => {
    setFormData(prev => {
      const newGoals = [...prev.goals];
      newGoals[index] = value;
      return { ...prev, goals: newGoals };
    });
  };

  const addGoal = () => {
    setFormData(prev => ({
      ...prev,
      goals: [...prev.goals, '']
    }));
  };

  // Сохранение программы
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      const weekStart = Timestamp.fromDate(new Date(formData.weekStartDate));
      const weekEnd = new Date(formData.weekStartDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndTimestamp = Timestamp.fromDate(weekEnd);

      const filteredGoals = formData.goals.filter(g => g.trim());

      // Формируем дни с датами
      const days = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(formData.weekStartDate);
        dayDate.setDate(dayDate.getDate() + i);
        days.push({
          dayNumber: i + 1,
          date: Timestamp.fromDate(dayDate),
          dayTitle: formData.days[i]?.dayTitle || '',
          dayGoal: formData.days[i]?.dayGoal || '',
          workouts: formData.days[i]?.workouts || [],
          tasks: formData.days[i]?.tasks || []
        });
      }

      const planData = {
        assignedUserId: selectedUser.id,
        createdBy: user.uid,
        weekStartDate: weekStart,
        weekEndDate: weekEndTimestamp,
        programGoal: formData.programGoal?.trim() || '',
        goals: filteredGoals,
        days: days,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Проверяем есть ли активная программа для этого пользователя
      const existingProgramsQuery = query(
        collection(db, 'trainingPrograms'),
        where('assignedUserId', '==', selectedUser.id),
        where('status', '==', 'active')
      );
      const existingProgramsSnapshot = await getDocs(existingProgramsQuery);

      if (editingProgramId) {
        // Обновляем редактируемую программу
        const programRef = doc(db, 'trainingPrograms', editingProgramId);
        await updateDoc(programRef, {
          ...planData,
          updatedAt: serverTimestamp()
        });
        
        console.log('Программа обновлена:', editingProgramId);
        alert(language === 'ru' 
          ? 'Программа обновлена успешно' 
          : 'Program updated successfully');
      } else if (!existingProgramsSnapshot.empty) {
        // Обновляем существующую активную программу
        const existingProgramDoc = existingProgramsSnapshot.docs[0];
        const existingProgramRef = doc(db, 'trainingPrograms', existingProgramDoc.id);
        
        await updateDoc(existingProgramRef, {
          ...planData,
          updatedAt: serverTimestamp()
        });
        
        console.log('Программа обновлена:', existingProgramDoc.id);
        alert(language === 'ru' 
          ? 'Программа обновлена успешно' 
          : 'Program updated successfully');
      } else {
        // Создаем новую программу
        const docRef = await addDoc(collection(db, 'trainingPrograms'), planData);
        console.log('Программа создана с ID:', docRef.id);
        alert(language === 'ru' 
          ? TEXTS.ru.trainingProgram.programCreated 
          : TEXTS.en.trainingProgram.programCreated);
      }
      
      // Перезагружаем список программ
      await loadPrograms();
      
      // Сброс формы
      setFormData({
        weekStartDate: new Date().toISOString().split('T')[0],
        goals: [''],
        programGoal: '',
        days: Array(7).fill(null).map(() => ({
          dayTitle: '',
          dayGoal: '',
          workouts: [],
          tasks: []
        }))
      });
      setSelectedUser(null);
      setSearchEmail('');
      setEditingProgramId(null);
    } catch (error) {
      console.error('Ошибка при сохранении программы:', error);
      alert(language === 'ru' 
        ? TEXTS.ru.trainingProgram.error 
        : TEXTS.en.trainingProgram.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProgram = async (program) => {
    try {
      // Находим пользователя по ID
      const userData = users.find(u => u.id === program.assignedUserId);
      if (userData) {
        setSelectedUser(userData);
        setSearchEmail(userData.email || '');
      }

      // Загружаем данные программы в форму
      const weekStartDate = program.weekStartDate?.toDate 
        ? program.weekStartDate.toDate().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData({
        weekStartDate: weekStartDate,
        goals: program.goals && program.goals.length > 0 ? program.goals : [''],
        programGoal: program.programGoal || '',
        days: program.days && program.days.length === 7 
          ? program.days.map(day => ({
              dayTitle: day.dayTitle || '',
              dayGoal: day.dayGoal || '',
              workouts: day.workouts || [],
              tasks: day.tasks || []
            }))
          : Array(7).fill(null).map(() => ({
              dayTitle: '',
              dayGoal: '',
              workouts: [],
              tasks: []
            }))
      });

      setEditingProgramId(program.id);
      setShowProgramsList(false);
      
      // Прокручиваем к форме
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Ошибка при загрузке программы для редактирования:', error);
      alert(language === 'ru' 
        ? `Ошибка при загрузке программы: ${error.message}` 
        : `Error loading program: ${error.message}`);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!confirm(language === 'ru' 
      ? 'Вы уверены, что хотите удалить эту программу?' 
      : 'Are you sure you want to delete this program?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'trainingPrograms', programId));
      await loadPrograms();
      alert(language === 'ru' 
        ? 'Программа удалена успешно' 
        : 'Program deleted successfully');
    } catch (error) {
      console.error('Ошибка при удалении программы:', error);
      alert(language === 'ru' 
        ? `Ошибка при удалении программы: ${error.message}` 
        : `Error deleting program: ${error.message}`);
    }
  };

  const handleNewProgram = () => {
    setFormData({
      weekStartDate: new Date().toISOString().split('T')[0],
      goals: [''],
      programGoal: '',
      days: Array(7).fill(null).map(() => ({
        dayTitle: '',
        dayGoal: '',
        workouts: [],
        tasks: []
      }))
    });
    setSelectedUser(null);
    setSearchEmail('');
    setEditingProgramId(null);
    setShowProgramsList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const dayNames = language === 'ru' ? DAY_NAMES_RU : DAY_NAMES;

  return (
    <>
      <Navigation currentPage="admin" user={user} />
      <div className="min-h-screen bg-black pt-20 pb-8">
        <div className="max-w-[1600px] mx-auto px-4">
          {/* Заголовок и кнопки управления */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">
              {TEXTS[language].trainingProgram.title}
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProgramsList(!showProgramsList)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
              >
                {showProgramsList 
                  ? (language === 'ru' ? 'Скрыть программы' : 'Hide Programs')
                  : (language === 'ru' ? 'Показать программы' : 'Show Programs')}
              </button>
              <button
                onClick={handleNewProgram}
                className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-all"
              >
                {language === 'ru' ? '+ Новая программа' : '+ New Program'}
              </button>
            </div>
          </div>

          {/* Список существующих программ */}
          {showProgramsList && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {language === 'ru' ? 'Существующие программы' : 'Existing Programs'}
              </h2>
              {programs.length === 0 ? (
                <p className="text-white/60">
                  {language === 'ru' ? 'Нет сохраненных программ' : 'No saved programs'}
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {programs.map((program) => {
                    const assignedUser = users.find(u => u.id === program.assignedUserId);
                    const createdAt = program.createdAt?.toDate 
                      ? program.createdAt.toDate().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')
                      : '-';
                    const weekStart = program.weekStartDate?.toDate 
                      ? program.weekStartDate.toDate().toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US')
                      : '-';

                    return (
                      <div
                        key={program.id}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-yellow-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                program.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {program.status === 'active' 
                                  ? (language === 'ru' ? 'Активна' : 'Active')
                                  : (language === 'ru' ? 'Неактивна' : 'Inactive')}
                              </span>
                              {editingProgramId === program.id && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                  {language === 'ru' ? 'Редактируется' : 'Editing'}
                                </span>
                              )}
                            </div>
                            <p className="text-white font-medium mb-1">
                              {assignedUser?.email || assignedUser?.displayName || program.assignedUserId}
                            </p>
                            {program.programGoal && (
                              <p className="text-white/60 text-sm mb-2 line-clamp-2">
                                {program.programGoal}
                              </p>
                            )}
                            <div className="flex gap-4 text-white/60 text-xs">
                              <span>{language === 'ru' ? 'Неделя:' : 'Week:'} {weekStart}</span>
                              <span>{language === 'ru' ? 'Создана:' : 'Created:'} {createdAt}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditProgram(program)}
                              className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-all text-sm"
                            >
                              {language === 'ru' ? 'Редактировать' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleDeleteProgram(program.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-all text-sm"
                            >
                              {language === 'ru' ? 'Удалить' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Форма выбора пользователя и даты */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white text-sm mb-2">
                  {TEXTS[language].trainingProgram.searchUser}
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchUser()}
                    placeholder={TEXTS[language].trainingProgram.searchUser}
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-yellow-500"
                  />
                  <button
                    onClick={handleSearchUser}
                    disabled={isSearchingUser}
                    className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearchingUser 
                      ? (language === 'ru' ? 'Поиск...' : 'Searching...') 
                      : (language === 'ru' ? 'Найти' : 'Search')}
                  </button>
                </div>
                {selectedUser && (
                  <div className="mt-2">
                    <p className="text-green-400 text-sm">
                      {language === 'ru' ? 'Выбрано:' : 'Selected:'} {selectedUser.email}
                    </p>
                    {selectedUser.displayName && (
                      <p className="text-white/60 text-xs mt-1">
                        {selectedUser.displayName}
                      </p>
                    )}
                  </div>
                )}
                {/* Список пользователей для быстрого выбора */}
                {users.length > 0 && searchEmail && !selectedUser && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {users
                      .filter(u => u.email?.toLowerCase().includes(searchEmail.toLowerCase()))
                      .slice(0, 5)
                      .map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white text-sm transition-all"
                        >
                          {u.email}
                          {u.displayName && <span className="text-white/60 ml-2">({u.displayName})</span>}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white text-sm mb-2">
                  {TEXTS[language].trainingProgram.weekStartDate}
                </label>
                <input
                  type="date"
                  value={formData.weekStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, weekStartDate: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedUser}
                  className="w-full px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-lg font-medium hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting 
                    ? TEXTS[language].common.loading 
                    : editingProgramId 
                      ? (language === 'ru' ? 'Обновить программу' : 'Update Program')
                      : TEXTS[language].trainingProgram.saveProgram}
                </button>
              </div>
            </div>

            {/* Цель программы тренировок */}
            <div className="mt-4">
              <label className="block text-white text-sm mb-2">
                {language === 'ru' ? 'Цель программы тренировок' : 'Training Program Goal'}
              </label>
              <textarea
                value={formData.programGoal}
                onChange={(e) => setFormData(prev => ({ ...prev, programGoal: e.target.value }))}
                placeholder={language === 'ru' ? 'Опишите общую цель программы тренировок...' : 'Describe the overall goal of the training program...'}
                rows={3}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-yellow-500 resize-none"
              />
            </div>

            {/* Цели недели */}
            <div className="mt-4">
              <label className="block text-white text-sm mb-2">
                {TEXTS[language].trainingProgram.weekGoals}
              </label>
              {formData.goals.map((goal, index) => (
                <input
                  key={index}
                  type="text"
                  value={goal}
                  onChange={(e) => updateGoals(index, e.target.value)}
                  placeholder={`${language === 'ru' ? 'Цель' : 'Goal'} ${index + 1}`}
                  className="w-full mb-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-yellow-500"
                />
              ))}
              <button
                onClick={addGoal}
                className="text-yellow-400 text-sm hover:text-yellow-300"
              >
                + {TEXTS[language].trainingProgram.addGoal}
              </button>
            </div>
          </div>

          {/* Библиотека упражнений - маленькие карточки по 2-4 в ряд */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {TEXTS[language].trainingProgram.exercisesLibrary}
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm">
                  {language === 'ru' ? 'Активный день:' : 'Active day:'} {dayNames[activeDayIndex]} ({activeDayIndex + 1})
                </span>
                <button
                  onClick={() => addTextExerciseToDay(activeDayIndex)}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all text-sm"
                >
                  + {TEXTS[language].trainingProgram.addTextExercise}
                </button>
              </div>
            </div>

            {/* Фильтр */}
            <ExercisesFilter
              selectedGroup={selectedCategory}
              setSelectedGroup={setSelectedCategory}
              exercises={exercises}
            />

            {/* Сетка упражнений - 2-4 в ряд */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
              {filteredExercises.map((exercise) => (
                <motion.div
                  key={exercise.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/5 rounded-lg overflow-hidden cursor-pointer hover:bg-white/10 transition-all border border-white/10 hover:border-yellow-500/50"
                  onClick={() => addExerciseToDay(activeDayIndex, exercise)}
                >
                  <div className="aspect-video">
                    <LazyVideo
                      src={exercise.video}
                      poster={exercise.poster}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-white text-xs font-medium p-2 text-center truncate">{exercise.title}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Недельный план */}
          <div className="space-y-4">
            {formData.days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border-2 transition-all ${
                  activeDayIndex === dayIndex ? 'border-yellow-500' : 'border-transparent'
                }`}
                onClick={() => setActiveDayIndex(dayIndex)}
              >
                {/* Заголовок дня */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {dayNames[dayIndex]} ({dayIndex + 1})
                    </h3>
                    {activeDayIndex === dayIndex && (
                      <span className="text-yellow-400 text-sm">● {language === 'ru' ? 'Активен' : 'Active'}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={day.dayTitle}
                    onChange={(e) => setFormData(prev => {
                      const newDays = [...prev.days];
                      newDays[dayIndex].dayTitle = e.target.value;
                      return { ...prev, days: newDays };
                    })}
                    placeholder={TEXTS[language].trainingProgram.dayTitle}
                    className="w-full mb-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-yellow-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <input
                    type="text"
                    value={day.dayGoal}
                    onChange={(e) => setFormData(prev => {
                      const newDays = [...prev.days];
                      newDays[dayIndex].dayGoal = e.target.value;
                      return { ...prev, days: newDays };
                    })}
                    placeholder={TEXTS[language].trainingProgram.dayGoal}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-yellow-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Упражнения */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {language === 'ru' ? 'Упражнения' : 'Exercises'}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addTextExerciseToDay(dayIndex);
                      }}
                      className="px-3 py-1 text-sm bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-all"
                    >
                      + {TEXTS[language].trainingProgram.addTextExercise}
                    </button>
                  </div>

                  {day.workouts && day.workouts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {day.workouts.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="bg-white/5 rounded-lg p-3 flex gap-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {exercise.isTextExercise ? (
                            <div className="flex-1 w-full">
                              <input
                                type="text"
                                value={exercise.exerciseName}
                                onChange={(e) => updateExercise(dayIndex, exercise.id, 'exerciseName', e.target.value)}
                                placeholder={TEXTS[language].trainingProgram.exerciseName}
                                className="w-full mb-2 px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-yellow-500"
                              />
                              <div className="flex gap-2 items-center">
                                <input
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(dayIndex, exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                  placeholder={TEXTS[language].trainingProgram.sets}
                                  className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-yellow-500"
                                />
                                <span className="text-white/60">×</span>
                                <input
                                  type="number"
                                  value={exercise.reps}
                                  onChange={(e) => updateExercise(dayIndex, exercise.id, 'reps', parseInt(e.target.value) || 0)}
                                  placeholder={TEXTS[language].trainingProgram.reps}
                                  className="w-20 px-2 py-1 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-yellow-500"
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-20 h-16 rounded overflow-hidden flex-shrink-0">
                                <LazyVideo
                                  src={exercise.exercise.video}
                                  poster={exercise.exercise.poster}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium mb-1 text-sm truncate">{exercise.exercise.title}</p>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(dayIndex, exercise.id, 'sets', parseInt(e.target.value) || 0)}
                                    placeholder={TEXTS[language].trainingProgram.sets}
                                    className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
                                  />
                                  <span className="text-white/60 text-sm">×</span>
                                  <input
                                    type="number"
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(dayIndex, exercise.id, 'reps', parseInt(e.target.value) || 0)}
                                    placeholder={TEXTS[language].trainingProgram.reps}
                                    className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExercise(dayIndex, exercise.id);
                            }}
                            className="text-red-400 hover:text-red-300 px-2 flex-shrink-0"
                          >
                            {TEXTS[language].trainingProgram.removeExercise}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm italic">
                      {TEXTS[language].trainingProgram.noExercises}
                    </p>
                  )}
                </div>

                {/* Текстовые задачи */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {language === 'ru' ? 'Задачи' : 'Tasks'}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addTask(dayIndex);
                      }}
                      className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-all"
                    >
                      + {language === 'ru' ? 'Задача' : 'Task'}
                    </button>
                  </div>

                  {day.tasks && day.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white/5 rounded-lg p-3 flex gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={task.text}
                            onChange={(e) => updateTask(dayIndex, task.id, 'text', e.target.value)}
                            placeholder={language === 'ru' ? 'Текст задачи' : 'Task text'}
                            className="flex-1 px-3 py-1 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-yellow-500"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTask(dayIndex, task.id);
                            }}
                            className="text-red-400 hover:text-red-300 px-2"
                          >
                            {TEXTS[language].common.delete}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/40 text-sm italic">
                      {language === 'ru' ? 'Задачи не добавлены' : 'No tasks added'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

