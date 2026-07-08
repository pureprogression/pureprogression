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
      trainingProgram: "Training Program",
      adminPanel: "Admin Panel",
      subscriptions: "Subscriptions",
      getAccess: "Get Full Access",
      telegramChat: "Chat with me",
      articles: "Useful Materials",
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
      signUpHere: "Sign up here",
      redirectSubscribe: "Sign in to continue to subscription",
      redirectWorkout: "Sign in — your workout will be saved after payment",
      continueWithGoogle: "Continue with Google"
    },

    // Main page
    home: {
      intro: {
        brand: "Pure.Progression",
        title: "Train smarter. Build your workout.",
        subtitle: "Video exercise library, personal workout builder, and free guides — all in one place",
        openBuilder: "Open workout builder",
        allGuides: "Guides & articles",
        guidesTitle: "Start with a guide",
        valueVideo: "Video for every exercise",
        valueBuilder: "Build your workout",
        valueGuides: "Free guides",
        freeToTry: "Try the builder free — subscribe to save workouts",
        scrollHint: "Builder below",
      },
      hero: {
        title: "Create Your Perfect Workout",
        subtitle: "Build personalized workouts with video exercises and track your progress",
        getStarted: "Get Started"
      },
      choice: {
        title: "Choose Your Path",
        builder: {
          title: "Workout Builder",
          description: "Create your own workouts by selecting exercises from our library",
          button: "Create Workout"
        },
        personal: {
          title: "Personal Training Program",
          description: "Get a customized training program designed specifically for you",
          button: "Get Program"
        }
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
      minutes: "minutes",
      browseTab: "Library",
      selectedTab: "My Workout",
      maxExercisesOnSave: "Please reduce your workout to 15 exercises or fewer before saving."
    },

    articlesPage: {
      premiumBadge: "Premium",
      premiumUnlock: "Full guide available with subscription",
      getAccess: "Get full access",
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
      completedExercises: "Completed Exercises",
      subscriptionActive: "Active subscription",
      subscriptionInactive: "Free plan",
      subscriptionInactiveHint: "Subscribe to save workouts and get full access",
      manageSubscription: "Manage subscription",
      getFullAccess: "Get full access",
      cancelSubscription: "Cancel auto-renewal",
      cancelConfirm:
        "Cancel auto-renewal? You will keep access until the end of the paid period. No further charges.",
      cancelSuccess: "Auto-renewal cancelled. Access until {date}.",
      cancelError: "Could not cancel subscription. Try again or contact support.",
      cancelledNotice: "Auto-renewal cancelled · access until {date}",
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

    // Training Program Builder
    trainingProgram: {
      title: "Training Program Builder",
      selectUser: "Select User",
      searchUser: "Search user by email...",
      weekStartDate: "Week Start Date",
      weekGoals: "Week Goals",
      addGoal: "Add Goal",
      exercisesLibrary: "Exercises Library",
      filterByMuscleGroup: "Filter by muscle group",
      allGroups: "All Groups",
      addExercise: "Add Exercise",
      addTextExercise: "Add Text Exercise",
      textExercise: "Text Exercise",
      exerciseName: "Exercise Name",
      sets: "Sets",
      reps: "Reps",
      notes: "Notes",
      morning: "Morning",
      day: "Day",
      evening: "Evening",
      dayTitle: "Day Title",
      dayGoal: "Day Goal",
      saveProgram: "Save Program",
      cancel: "Cancel",
      programCreated: "Program created successfully",
      programUpdated: "Program updated successfully",
      error: "Error occurred",
      removeExercise: "Remove",
      noExercises: "No exercises added",
      clickToAdd: "Click to add exercises"
    },

    // Plan Request
    planRequest: {
      title: "Request Weekly Plan",
      subtitle: "Tell us about your goals and we'll create a personalized plan for you",
      categories: "Categories",
      selectCategories: "Select what you want to work on",
      nutrition: "Nutrition & Control",
      nutritionDesc: "Meals, water, food diary, meal prep",
      routine: "Daily Routine & Sleep",
      routineDesc: "Wake up time, bedtime, morning routine",
      activity: "Physical Activity",
      activityDesc: "General workouts, steps, warm-up, stretching",
      recovery: "Recovery & Hardening",
      recoveryDesc: "Cold shower, walks, meditation, breathing",
      psychology: "Psychology & Motivation",
      psychologyDesc: "Gratitude, reading, phone-free time, planning",
      habits: "Breaking Bad Habits",
      habitsDesc: "No social media in the morning, no sweets, no late TV",
      goals: "Your Goals",
      goalsPlaceholder: "Describe what you want to achieve this week...",
      currentLevel: "Current Activity Level",
      low: "Low",
      medium: "Medium",
      high: "High",
      limitations: "Limitations & Special Notes",
      limitationsPlaceholder: "Health issues, time constraints, resources...",
      additionalInfo: "Additional Information",
      additionalInfoPlaceholder: "Anything else you'd like to share...",
      submit: "Submit Request",
      submitting: "Submitting...",
      success: "Request submitted successfully! We'll create your plan soon.",
      error: "Error submitting request",
      myRequests: "My Requests",
      noRequests: "You haven't submitted any requests yet",
      requestDate: "Request Date",
      status: "Status",
      statusNew: "New",
      statusInProgress: "In Progress",
      statusPlanCreated: "Plan Created"
    },

    // Subscription
    subscription: {
      title: "Unlock Full Access",
      subtitle: "Save workouts, unlimited favorites, and train with video guides",
      choosePlan: "Choose your plan",
      perMonth: "~{price}/mo",
      workoutWillBeSaved: "Your workout is ready — it will be saved right after payment",
      homeBanner: "Subscribe to save workouts and get full access",
      homeBannerCta: "View plans",
      subscribeNow: "Get Full Access",
      processing: "Processing...",
      paymentInfo: "Secure card payment · Cancel anytime",
      selectedPlan: "Selected",
      bestValue: "Best value",
      popular: "Popular",
      savePercent: "Save {percent}%",
      paymentSuccessTitle: "You're in!",
      paymentSuccessReceived: "Payment received",
      paymentSuccessSubtitle: "Your subscription is active. Let's train.",
      paymentSuccessPending: "Activating your subscription...",
      paymentSuccessTimeout: "Payment is processing. Access will unlock in a few minutes.",
      paymentSuccessWorkouts: "Go to My Workouts",
      paymentSuccessBuilder: "Back to Builder",
      noSubscriptionTitle: "No active subscription",
      noSubscriptionSubtitle: "Subscribe to save workouts and unlock all features",
      favoritesLimitTitle: "Favorites limit reached",
      favoritesLimitMessage: "Free plan includes up to 5 favorites. Subscribe for unlimited favorites and full access.",
      features: {
        title: "What You Get",
        createWorkouts: {
          title: "Create Personal Workouts",
          description: "Build custom workouts from our extensive exercise library"
        },
        videoGuides: {
          title: "Video Exercise Guides",
          description: "Learn proper form with professional exercise videos"
        },
        trackProgress: {
          title: "Track Your Progress",
          description: "Monitor your fitness journey and completed workouts"
        },
        unlimitedAccess: {
          title: "Unlimited Access",
          description: "Create and save unlimited workouts"
        },
        telegramChat: {
          title: "Telegram Chat with Me",
          description: "Ask questions about workouts and get personal guidance in Telegram"
        }
      }
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
      trainingProgram: "Программа тренировок",
      adminPanel: "Админ-панель",
      subscriptions: "Подписки",
      getAccess: "Получить доступ",
      telegramChat: "Чат со мной",
      articles: "Полезные материалы",
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
      signUpHere: "Зарегистрироваться здесь",
      redirectSubscribe: "Войдите, чтобы оформить подписку",
      redirectWorkout: "Войдите — тренировка сохранится после оплаты",
      continueWithGoogle: "Продолжить через Google"
    },

    home: {
      intro: {
        brand: "Pure.Progression",
        title: "Тренируйся умнее. Собери свою тренировку.",
        subtitle: "Видео-библиотека упражнений, конструктор тренировок и бесплатные гайды — в одном месте",
        openBuilder: "Открыть конструктор",
        allGuides: "Гайды и статьи",
        guidesTitle: "Начни с гайда",
        valueVideo: "Видео к каждому упражнению",
        valueBuilder: "Собери тренировку",
        valueGuides: "Бесплатные гайды",
        freeToTry: "Конструктор бесплатно — подписка для сохранения тренировок",
        scrollHint: "Конструктор ниже",
      },
      hero: {
        title: "Создайте идеальную тренировку",
        subtitle: "Создавайте персональные тренировки с видео упражнениями и отслеживайте прогресс",
        getStarted: "Начать"
      },
      choice: {
        title: "Выберите свой путь",
        builder: {
          title: "Конструктор тренировок",
          description: "Создавайте свои тренировки, выбирая упражнения из нашей библиотеки",
          button: "Создать тренировку"
        },
        personal: {
          title: "Персональная программа",
          description: "Получите индивидуальную программу тренировок, разработанную специально для вас",
          button: "Получить программу"
        }
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
      minutes: "минут",
      browseTab: "Библиотека",
      selectedTab: "Моя тренировка",
      maxExercisesOnSave: "Сохраните тренировку с не более чем 15 упражнениями."
    },

    articlesPage: {
      premiumBadge: "Подписка",
      premiumUnlock: "Полная статья доступна по подписке",
      getAccess: "Получить доступ",
    },

    profile: {
      title: "Профиль",
      user: "Пользователь",
      freePlan: "Бесплатный план",
      limitedFeatures: "Ограниченные возможности",
      upgrade: "Апгрейд",
      activity: "Активность",
      completedWorkouts: "Выполнено тренировок",
      completedExercises: "Выполнено упражнений",
      subscriptionActive: "Подписка активна",
      subscriptionInactive: "Бесплатный план",
      subscriptionInactiveHint: "Оформите подписку, чтобы сохранять тренировки",
      manageSubscription: "Управление подпиской",
      getFullAccess: "Получить доступ",
      cancelSubscription: "Отменить автопродление",
      cancelConfirm:
        "Отменить автопродление? Доступ сохранится до конца оплаченного периода. Следующие списания не будут.",
      cancelSuccess: "Автопродление отменено. Доступ до {date}.",
      cancelError: "Не удалось отменить подписку. Попробуйте снова или напишите в поддержку.",
      cancelledNotice: "Автопродление отменено · доступ до {date}",
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

    // Training Program Builder
    trainingProgram: {
      title: "Составление программы тренировок",
      selectUser: "Выберите пользователя",
      searchUser: "Поиск пользователя по email...",
      weekStartDate: "Дата начала недели",
      weekGoals: "Цели недели",
      addGoal: "Добавить цель",
      exercisesLibrary: "Библиотека упражнений",
      filterByMuscleGroup: "Фильтр по группе мышц",
      allGroups: "Все группы",
      addExercise: "Добавить упражнение",
      addTextExercise: "Добавить текстовое упражнение",
      textExercise: "Текстовое упражнение",
      exerciseName: "Название упражнения",
      sets: "Подходы",
      reps: "Повторения",
      notes: "Заметки",
      morning: "Утро",
      day: "День",
      evening: "Вечер",
      dayTitle: "Название дня",
      dayGoal: "Цель дня",
      saveProgram: "Сохранить программу",
      cancel: "Отмена",
      programCreated: "Программа успешно создана",
      programUpdated: "Программа успешно обновлена",
      error: "Произошла ошибка",
      removeExercise: "Удалить",
      noExercises: "Упражнения не добавлены",
      clickToAdd: "Нажмите, чтобы добавить упражнения"
    },

    // Plan Request
    planRequest: {
      title: "Запрос недельного плана",
      subtitle: "Расскажите о своих целях, и мы создадим для вас персональный план",
      categories: "Категории",
      selectCategories: "Выберите, над чем хотите работать",
      nutrition: "Питание и контроль",
      nutritionDesc: "Приемы пищи, вода, дневник питания, подготовка еды",
      routine: "Режим дня и сон",
      routineDesc: "Время подъема, отхода ко сну, утренняя рутина",
      activity: "Физическая активность",
      activityDesc: "Общие тренировки, шаги, разминка, растяжка",
      recovery: "Восстановление и закаливание",
      recoveryDesc: "Контрастный душ, прогулки, медитация, дыхание",
      psychology: "Психология и мотивация",
      psychologyDesc: "Благодарность, чтение, время без телефона, планирование",
      habits: "Отказ от вредных привычек",
      habitsDesc: "Не проверять соцсети утром, не есть сладкое, не смотреть сериалы поздно",
      goals: "Ваши цели",
      goalsPlaceholder: "Опишите, чего вы хотите достичь на этой неделе...",
      currentLevel: "Текущий уровень активности",
      low: "Низкий",
      medium: "Средний",
      high: "Высокий",
      limitations: "Ограничения и особые примечания",
      limitationsPlaceholder: "Проблемы со здоровьем, ограничения по времени, ресурсы...",
      additionalInfo: "Дополнительная информация",
      additionalInfoPlaceholder: "Все, чем вы хотели бы поделиться...",
      submit: "Отправить запрос",
      submitting: "Отправка...",
      success: "Запрос успешно отправлен! Мы скоро создадим для вас план.",
      error: "Ошибка при отправке запроса",
      myRequests: "Мои запросы",
      noRequests: "Вы еще не отправляли запросы",
      requestDate: "Дата запроса",
      status: "Статус",
      statusNew: "Новый",
      statusInProgress: "В работе",
      statusPlanCreated: "План создан"
    },

    subscription: {
      title: "Полный доступ",
      subtitle: "Сохраняйте тренировки, безлимитное избранное и видео по каждому упражнению",
      choosePlan: "Выберите план",
      perMonth: "~{price}/мес",
      workoutWillBeSaved: "Тренировка готова — сохранится сразу после оплаты",
      homeBanner: "Оформите подписку, чтобы сохранять тренировки",
      homeBannerCta: "Смотреть планы",
      subscribeNow: "Получить доступ",
      processing: "Обработка...",
      paymentInfo: "Безопасная оплата картой · Отмена в любой момент",
      selectedPlan: "Выбрано",
      bestValue: "Выгоднее всего",
      popular: "Популярный",
      savePercent: "Экономия {percent}%",
      paymentSuccessTitle: "Добро пожаловать!",
      paymentSuccessReceived: "Оплата получена",
      paymentSuccessSubtitle: "Подписка активна. Можно тренироваться.",
      paymentSuccessPending: "Активируем подписку...",
      paymentSuccessTimeout: "Оплата обрабатывается. Доступ откроется в течение нескольких минут.",
      paymentSuccessWorkouts: "К моим тренировкам",
      paymentSuccessBuilder: "В конструктор",
      noSubscriptionTitle: "Нет активной подписки",
      noSubscriptionSubtitle: "Оформите подписку, чтобы сохранять тренировки и открыть все функции",
      favoritesLimitTitle: "Лимит избранного",
      favoritesLimitMessage: "На бесплатном плане — до 5 упражнений в избранном. Оформите подписку для безлимитного избранного и полного доступа.",
      features: {
        title: "Что вы получаете",
        createWorkouts: {
          title: "Создание персональных тренировок",
          description: "Создавайте кастомные тренировки из нашей обширной библиотеки упражнений"
        },
        videoGuides: {
          title: "Видео-руководства по упражнениям",
          description: "Изучайте правильную технику с профессиональными видео упражнений"
        },
        trackProgress: {
          title: "Отслеживание прогресса",
          description: "Следите за своим фитнес-путешествием и выполненными тренировками"
        },
        unlimitedAccess: {
          title: "Неограниченный доступ",
          description: "Создавайте и сохраняйте неограниченное количество тренировок"
        },
        telegramChat: {
          title: "Чат со мной в Telegram",
          description: "Задавайте вопросы по тренировкам и получайте личные рекомендации в Telegram"
        }
      }
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
