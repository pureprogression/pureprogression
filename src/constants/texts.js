// Text constants for internationalization
// This structure allows easy expansion to multiple languages in the future

export const TEXTS = {
  en: {
    // Navigation
    navigation: {
      home: "Home",
      myWorkouts: "My Workouts", 
      workoutBuilder: "Workout Builder",
      workoutHistory: "Workout History",
      favorites: "Favorites",
      profile: "Profile",
      weeklyPlan: "Weekly Plan",
      adminPanel: "Admin Panel",
      logout: "Logout"
    },

    // Authentication
    auth: {
      signIn: "Sign In",
      signUp: "Sign Up", 
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      signInWithGoogle: "Sign in with Google",
      signUpWithGoogle: "Sign up with Google",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      signInHere: "Sign in here",
      signUpHere: "Sign up here"
    },

    // Main page
    home: {
      hero: {
        title: "Create Your Perfect Workout",
        subtitle: "Build personalized workouts with video exercises and track your progress",
        getStarted: "Get Started"
      },
      features: {
        title: "Why Choose PureP?",
        createWorkouts: {
          title: "Create Workouts",
          description: "Build custom workouts from our exercise library"
        },
        trackProgress: {
          title: "Track Progress", 
          description: "Monitor your fitness journey and achievements"
        },
        videoGuides: {
          title: "Video Guides",
          description: "Learn proper form with professional exercise videos"
        }
      }
    },

    // Workouts
    workouts: {
      myWorkouts: "My Workouts",
      noWorkouts: "You don't have any workouts yet",
      createFirstWorkout: "Create your first workout with the builder",
      createWorkout: "Create Workout",
      startWorkout: "Start Workout",
      editWorkout: "Edit Workout", 
      deleteWorkout: "Delete Workout",
      confirmDelete: "Are you sure you want to delete this workout?",
      workoutWillBeDeleted: "Workout will be permanently deleted.",
      cancel: "Cancel",
      delete: "Delete",
      estimatedDuration: "Estimated duration",
      minutes: "minutes"
    },

    // Workout Builder
    workoutBuilder: {
      title: "Workout Builder",
      workoutName: "Workout Name",
      workoutDescription: "Workout Description (optional)",
      addExercises: "Add Exercises",
      selectExercises: "Select exercises for your workout",
      selectedExercises: "Selected Exercises",
      noExercisesSelected: "No exercises selected",
      removeExercise: "Remove Exercise",
      saveWorkout: "Save Workout",
      cancel: "Cancel",
      estimatedDuration: "Estimated Duration",
      minutes: "minutes"
    },

    // Profile
    profile: {
      title: "Profile",
      user: "User",
      freePlan: "Free Plan",
      limitedFeatures: "Limited features",
      upgrade: "Upgrade",
      activity: "Activity",
      completedWorkouts: "Completed Workouts",
      completedExercises: "Completed Exercises"
    },

    // Workout History
    workoutHistory: {
      title: "Workout History",
      noHistory: "You don't have any workout history yet",
      startTraining: "Start Training",
      completeFirstWorkout: "Complete your first workout to see progress here",
      createWorkout: "Create Workout"
    },

    // Favorites
    favorites: {
      title: "Favorites",
      noFavorites: "No favorite exercises",
      addToFavorites: "Add exercises to favorites to see them here"
    },

    // Exercise names (from your data)
    exercises: {
      australianPullups: "Australian Pull-ups",
      bandMuscleUps: "Band Muscle-Ups", 
      lPullups: "L Pull-ups",
      corePullups: "Core Pull-ups"
    },

    // Weekly Plan
    weeklyPlan: {
      title: "Weekly Plan",
      noPlan: "You don't have an active weekly plan yet",
      waitingForPlan: "Your coach will create a personalized plan for you soon",
      weekGoals: "Week Goals",
      day: "Day",
      tasks: "Tasks",
      addComment: "Add comment",
      comment: "Comment",
      saveComment: "Save",
      editTask: "Edit task",
      deleteTask: "Delete task",
      completeWeek: "Complete Week",
      completed: "Completed",
      active: "Active",
      progress: "Progress",
      ofTasksCompleted: "of tasks completed",
      history: "History",
      viewHistory: "View History"
    },

    // Admin Weekly Plans
    adminWeeklyPlans: {
      title: "Weekly Plans Management",
      createPlan: "Create New Plan",
      activePlans: "Active Plans",
      allPlans: "All Plans",
      selectUser: "Select User",
      searchUser: "Search user by email...",
      weekStartDate: "Week Start Date",
      weekGoals: "Week Goals",
      addGoal: "Add Goal",
      day: "Day",
      addTask: "Add Task",
      taskText: "Task text",
      savePlan: "Save Plan",
      cancel: "Cancel",
      editPlan: "Edit Plan",
      viewPlan: "View Plan",
      assignedTo: "Assigned to",
      status: "Status",
      createdAt: "Created at",
      noPlans: "No plans found",
      planCreated: "Plan created successfully",
      planUpdated: "Plan updated successfully",
      error: "Error occurred"
    },

    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous"
    }
  },

  // Russian translations
  ru: {
    navigation: {
      home: "Главная",
      myWorkouts: "Мои тренировки",
      workoutBuilder: "Конструктор тренировок", 
      workoutHistory: "История тренировок",
      favorites: "Избранное",
      profile: "Профиль",
      weeklyPlan: "Недельный план",
      adminPanel: "Админ-панель",
      logout: "Выйти"
    },

    auth: {
      signIn: "Вход",
      signUp: "Регистрация", 
      email: "Email",
      password: "Пароль",
      confirmPassword: "Подтвердите пароль",
      signInWithGoogle: "Войти через Google",
      signUpWithGoogle: "Зарегистрироваться через Google",
      alreadyHaveAccount: "Уже есть аккаунт?",
      dontHaveAccount: "Нет аккаунта?",
      signInHere: "Войти здесь",
      signUpHere: "Зарегистрироваться здесь"
    },

    home: {
      hero: {
        title: "Создайте идеальную тренировку",
        subtitle: "Создавайте персональные тренировки с видео упражнениями и отслеживайте прогресс",
        getStarted: "Начать"
      },
      features: {
        title: "Почему PureP?",
        createWorkouts: {
          title: "Создание тренировок",
          description: "Создавайте кастомные тренировки из нашей библиотеки упражнений"
        },
        trackProgress: {
          title: "Отслеживание прогресса", 
          description: "Следите за своим фитнес-путешествием и достижениями"
        },
        videoGuides: {
          title: "Видео-руководства",
          description: "Изучайте правильную технику с профессиональными видео упражнений"
        }
      }
    },

    workouts: {
      myWorkouts: "Мои тренировки",
      noWorkouts: "У вас пока нет тренировок",
      createFirstWorkout: "Создайте свою первую тренировку с помощью конструктора",
      createWorkout: "Создать тренировку",
      startWorkout: "Начать тренировку",
      editWorkout: "Редактировать тренировку", 
      deleteWorkout: "Удалить тренировку",
      confirmDelete: "Удалить тренировку?",
      workoutWillBeDeleted: "Тренировка будет удалена навсегда.",
      cancel: "Отмена",
      delete: "Удалить",
      estimatedDuration: "Примерная длительность",
      minutes: "минут"
    },

    workoutBuilder: {
      title: "Конструктор тренировок",
      workoutName: "Название тренировки",
      workoutDescription: "Описание тренировки (необязательно)",
      addExercises: "Добавить упражнения",
      selectExercises: "Выберите упражнения для тренировки",
      selectedExercises: "Выбранные упражнения",
      noExercisesSelected: "Упражнения не выбраны",
      removeExercise: "Удалить упражнение",
      saveWorkout: "Сохранить тренировку",
      cancel: "Отмена",
      estimatedDuration: "Примерная длительность",
      minutes: "минут"
    },

    profile: {
      title: "Профиль",
      user: "Пользователь",
      freePlan: "Бесплатный план",
      limitedFeatures: "Ограниченные возможности",
      upgrade: "Апгрейд",
      activity: "Активность",
      completedWorkouts: "Выполнено тренировок",
      completedExercises: "Выполнено упражнений"
    },

    workoutHistory: {
      title: "История тренировок",
      noHistory: "У вас пока нет истории тренировок",
      startTraining: "Начните тренироваться",
      completeFirstWorkout: "Выполните свою первую тренировку, чтобы отслеживать прогресс",
      createWorkout: "Создать тренировку"
    },

    favorites: {
      title: "Избранные упражнения",
      noFavorites: "Нет избранных упражнений",
      addToFavorites: "Добавьте упражнения в избранное, чтобы видеть их здесь"
    },

    exercises: {
      australianPullups: "Австралийские подтягивания",
      bandMuscleUps: "Подтягивания на резине", 
      lPullups: "L-подтягивания",
      corePullups: "Подтягивания на пресс"
    },

    weeklyPlan: {
      title: "Недельный план",
      noPlan: "У вас пока нет активного недельного плана",
      waitingForPlan: "Ваш тренер скоро создаст для вас персональный план",
      weekGoals: "Цели недели",
      day: "День",
      tasks: "Задачи",
      addComment: "Добавить комментарий",
      comment: "Комментарий",
      saveComment: "Сохранить",
      editTask: "Редактировать задачу",
      deleteTask: "Удалить задачу",
      completeWeek: "Завершить неделю",
      completed: "Завершено",
      active: "Активен",
      progress: "Прогресс",
      ofTasksCompleted: "задач выполнено",
      history: "История",
      viewHistory: "Посмотреть историю"
    },

    adminWeeklyPlans: {
      title: "Управление недельными планами",
      createPlan: "Создать новый план",
      activePlans: "Активные планы",
      allPlans: "Все планы",
      selectUser: "Выберите пользователя",
      searchUser: "Поиск пользователя по email...",
      weekStartDate: "Дата начала недели",
      weekGoals: "Цели недели",
      addGoal: "Добавить цель",
      day: "День",
      addTask: "Добавить задачу",
      taskText: "Текст задачи",
      savePlan: "Сохранить план",
      cancel: "Отмена",
      editPlan: "Редактировать план",
      viewPlan: "Просмотр плана",
      assignedTo: "Назначено",
      status: "Статус",
      createdAt: "Создано",
      noPlans: "Планы не найдены",
      planCreated: "План успешно создан",
      planUpdated: "План успешно обновлен",
      error: "Произошла ошибка"
    },

    common: {
      loading: "Загрузка...",
      error: "Ошибка",
      success: "Успешно",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      close: "Закрыть",
      back: "Назад",
      next: "Далее",
      previous: "Назад"
    }
  }
};

// Helper function to get text (prepares for future i18n expansion)
export const getText = (path, lang = 'en') => {
  const keys = path.split('.');
  let text = TEXTS[lang];
  
  for (const key of keys) {
    text = text?.[key];
  }
  
  return text || path; // Fallback to path if translation not found
};

// Export default language
export default TEXTS.en;
