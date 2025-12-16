const ASSETS_BASE_URL = process.env.NEXT_PUBLIC_ASSETS_BASE_URL || "https://pub-24028780ba564e299106a5335d66f54c.r2.dev";

// Функция для получения названия упражнения в зависимости от языка
export const getExerciseTitle = (exercise, language = 'ru') => {
  if (language === 'en' && exercise.titleEn) {
    return exercise.titleEn;
  }
  return exercise.title;
};

export const exercises = [
    {
        id: "4",
        title: "Выход в вертикальный вис",
        titleEn: "Vertical Hang Exit",
        video: `${ASSETS_BASE_URL}/videos/x72.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x72.jpg`,
        muscleGroups: ["abs","core"]
    },
    {
        id: "6",
        title: "Стойка на руках с опорой",
        titleEn: "Supported Handstand",
        video: `${ASSETS_BASE_URL}/videos/x113.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x113.jpg`,
        muscleGroups: ["shoulders","arms"]
    },
    {
        id: "8",
        title: "Отжимания с наклоном",
        titleEn: "Incline Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x124.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x124.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "9",
        title: "Отжимания концентрированно",
        titleEn: "Concentrated Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x32.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x32.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "10",
        title: "Подтягивания в уголке",
        titleEn: "L-sit Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x29.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x29.1.jpg`,
        muscleGroups: ["complex","back","abs","arms","legs"]
    },
    {
        id: "11",
        title: "Динамичный передний вис",
        titleEn: "Dynamic Front Hang",
        video: `${ASSETS_BASE_URL}/videos/x29.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x29.2.jpg`,
        muscleGroups: ["abs","back"]
    },
    {
        id: "12",
        title: "Подтягивания до груди",
        titleEn: "Chest Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x29.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x29.3.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "13",
        title: "Лопаточные подтягивания",
        titleEn: "Scapular Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x30.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x30.1.jpg`,
        muscleGroups: ["back"]
    },
    {
        id: "14",
        title: "Отжимания на брусьях",
        titleEn: "Parallel Bar Dips",
        video: `${ASSETS_BASE_URL}/videos/x31.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x31.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "15",
        title: "Отжимания от брусьев + мах ногами",
        titleEn: "Dips + Leg Swing",
        video: `${ASSETS_BASE_URL}/videos/x31.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x31.2.jpg`,
        muscleGroups: ["complex","chest","abs","arms","legs"]
    },
    {
        id: "16",
        title: "Разгибание рук из упора лежа",
        titleEn: "Tricep Extension from Plank",
        video: `${ASSETS_BASE_URL}/videos/x31.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x31.3.jpg`,
        muscleGroups: ["arms","core"]
    },
    {
        id: "17",
        title: "Отжимания динаминые",
        titleEn: "Dynamic Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x32.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x32.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "18",
        title: "Отжимания от брусьев + кор",
        titleEn: "Dips + Core",
        video: `${ASSETS_BASE_URL}/videos/x32.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x32.2.jpg`,
        muscleGroups: ["complex","chest","arms","abs"]
    },
    {
        id: "19",
        title: "Выход на две с прыжка",
        titleEn: "Muscle-up from Jump",
        video: `${ASSETS_BASE_URL}/videos/x32.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x32.3.jpg`,
        muscleGroups: ["back","chest","arms"]
    }
,
    {
        id: "20",
        title: "Упор на руках",
        titleEn: "Handstand Hold",
        video: `${ASSETS_BASE_URL}/videos/x.1.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x.1.1.jpg`,
        muscleGroups: ["shoulders","arms","core"]
    },
    {
        id: "21",
        title: "Упор на руках с подъемом ног",
        titleEn: "Handstand Hold with Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x.2.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x.2.1.jpg`,
        muscleGroups: ["complex","shoulders","arms","core"]
    },
    {
        id: "22",
        title: "Упор с прожимом вверх",
        titleEn: "Handstand Push-up",
        video: `${ASSETS_BASE_URL}/videos/x.3.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x.3.1.jpg`,
        muscleGroups: ["shoulders","arms","core"]
    },
    {
        id: "23",
        title: "Упор с прожимом в стойку на руках",
        titleEn: "Handstand Push-up to Handstand",
        video: `${ASSETS_BASE_URL}/videos/x.4.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x.4.1.jpg`,
        muscleGroups: ["complex","shoulders","arms","core"]
    },
    {
        id: "24",
        title: "Вис в уголке динамично",
        titleEn: "Dynamic L-sit Hang",
        video: `${ASSETS_BASE_URL}/videos/x1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x1.jpg`,
        muscleGroups: ["back","abs","legs"]
    },
    {
        id: "25",
        title: "Скакалка ускорение",
        titleEn: "Jump Rope Acceleration",
        video: `${ASSETS_BASE_URL}/videos/x10.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x10.1.jpg`,
        muscleGroups: ["legs"]
    },
    {
        id: "26",
        title: "Выпрыгивания",
        titleEn: "Jump Squats",
        video: `${ASSETS_BASE_URL}/videos/x10.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x10.2.jpg`,
        muscleGroups: ["legs"]
    },
    {
        id: "27",
        title: "Берпи-кор на брусьях",
        titleEn: "Burpee Core on Bars",
        video: `${ASSETS_BASE_URL}/videos/x10.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x10.3.jpg`,
        muscleGroups: ["complex","abs","chest","arms","core"]
    },
    {
        id: "28",
        title: "Австралийские динамичные",
        titleEn: "Dynamic Australian Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x10.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x10.4.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "29",
        title: "Отжимания на брусьях + отягощение",
        titleEn: "Weighted Parallel Bar Dips",
        video: `${ASSETS_BASE_URL}/videos/x11.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x11.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "30",
        title: "Отжимания в уголке на брусьях + отягощение",
        titleEn: "Weighted L-sit Dips on Bars",
        video: `${ASSETS_BASE_URL}/videos/x11.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x11.2.jpg`,
        muscleGroups: ["shoulders","arms"]
    },
    {
        id: "31",
        title: "Стойка на руках с опорой",
        titleEn: "Supported Handstand",
        video: `${ASSETS_BASE_URL}/videos/x11.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x11.3.jpg`,
        muscleGroups: ["shoulders","arms","core"]
    },
    {
        id: "32",
        title: "Перекаты в упоре лежа",
        titleEn: "Rolling Plank",
        video: `${ASSETS_BASE_URL}/videos/x12.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x12.1.jpg`,
        muscleGroups: ["complex","chest","shoulders","core","arms"]
    },
    {
        id: "33",
        title: "Отжимания с акцентом на одну руку",
        titleEn: "One-arm Emphasis Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x12.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x12.2.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "34",
        title: "Отжимания с наклоном вперед",
        titleEn: "Forward Incline Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x12.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x12.3.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "35",
        title: "Отжимания под наклоном",
        titleEn: "Decline Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x12.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x12.4.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "36",
        title: "Подтягивания в уголке с резиной",
        titleEn: "L-sit Pull-ups with Resistance Band",
        video: `${ASSETS_BASE_URL}/videos/x13.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x13.1.jpg`,
        muscleGroups: ["back","arms","legs"]
    },
    {
        id: "37",
        title: "Закрытый вис + уголок",
        titleEn: "Closed Hang + L-sit",
        video: `${ASSETS_BASE_URL}/videos/x13.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x13.2.jpg`,
        muscleGroups: ["complex"]
    },
    {
        id: "38",
        title: "Вис в уголке активный",
        titleEn: "Active L-sit Hang",
        video: `${ASSETS_BASE_URL}/videos/x13.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x13.3.jpg`,
        muscleGroups: ["back","arms","legs"]
    },
    {
        id: "39",
        title: "Вис в уголке с подъемом ног",
        titleEn: "L-sit Hang with Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x13.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x13.4.jpg`,
        muscleGroups: ["back","abs","legs"]
    },
    {
        id: "40",
        title: "Выход на две с паузой",
        titleEn: "Muscle-up with Pause",
        video: `${ASSETS_BASE_URL}/videos/x15.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x15.1.jpg`,
        muscleGroups: ["complex"]
    },
    {
        id: "42",
        title: "Высокие подтягивания с паузой",
        titleEn: "High Pull-ups with Pause",
        video: `${ASSETS_BASE_URL}/videos/x15.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x15.3.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "43",
        title: "Отжимания на стойках низкие",
        titleEn: "Low Push-ups on Stands",
        video: `${ASSETS_BASE_URL}/videos/x16.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x16.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "44",
        title: "Отжимания + выход в уголок",
        titleEn: "Push-ups + L-sit Exit",
        video: `${ASSETS_BASE_URL}/videos/x16.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x16.2.jpg`,
        muscleGroups: ["chest","abs","legs"]
    },
    {
        id: "45",
        title: "Отжимания поочередные на стойках",
        titleEn: "Alternating Push-ups on Stands",
        video: `${ASSETS_BASE_URL}/videos/x16.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x16.3.jpg`,
        muscleGroups: ["chest","arms","shoulders"]
    },
    {
        id: "46",
        title: "Уголок + выход закрытый планш",
        titleEn: "L-sit + Closed Planche Exit",
        video: `${ASSETS_BASE_URL}/videos/x16.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x16.4.jpg`,
        muscleGroups: ["abs","back","legs"]
    },
    {
        id: "47",
        title: "Выход в стойку на руках с локтей на брусьях",
        titleEn: "Elbow to Handstand on Bars",
        video: `${ASSETS_BASE_URL}/videos/x17.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x17.1.jpg`,
        muscleGroups: ["complex"]
    },
    {
        id: "48",
        title: "Отжимания + выход в стойку",
        titleEn: "Push-ups + Handstand Exit",
        video: `${ASSETS_BASE_URL}/videos/x17.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x17.2.jpg`,
        muscleGroups: ["back","arms","chest","shoulders","core"]
    },
    {
        id: "49",
        title: "Уголок на высоких брусьях",
        titleEn: "L-sit on High Bars",
        video: `${ASSETS_BASE_URL}/videos/x17.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x17.3.jpg`,
        muscleGroups: ["chest","arms","abs","core"]
    },
    {
        id: "50",
        title: "Подтягивания + выход в уголок",
        titleEn: "Pull-ups + L-sit Exit",
        video: `${ASSETS_BASE_URL}/videos/x18.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x18.1.jpg`,
        muscleGroups: ["back","arms","abs","core"]
    },
    {
        id: "51",
        title: "Подтягивания попеременные",
        titleEn: "Alternating Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x18.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x18.2.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "52",
        title: "Подтягивания к корпусу группировкой",
        titleEn: "Tucked Pull-ups to Body",
        video: `${ASSETS_BASE_URL}/videos/x18.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x18.3.jpg`,
        muscleGroups: ["back","abs"]
    },
    {
        id: "53",
        title: "Складка на турнике",
        titleEn: "Hanging Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x18.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x18.4.jpg`,
        muscleGroups: ["abs","core"]
    },
    {
        id: "54",
        title: "Подъем ног в висе",
        titleEn: "Hanging Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x2.jpg`,
        muscleGroups: ["back","arms","abs","core"]
    },
    {
        id: "55",
        title: "Подтягивания с группировкой + уголок",
        titleEn: "Tucked Pull-ups + L-sit",
        video: `${ASSETS_BASE_URL}/videos/x21.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x21.1.jpg`,
        muscleGroups: ["back","abs","legs"]
    },
    {
        id: "56",
        title: "Подтягивания с прямыми ногами",
        titleEn: "Straight Leg Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x21.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x21.2.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "57",
        title: "Подтягвиаиния + вытяжение ног",
        titleEn: "Pull-ups + Leg Extension",
        video: `${ASSETS_BASE_URL}/videos/x21.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x21.3.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "58",
        title: "Уголок на брусьях динамично",
        titleEn: "Dynamic L-sit on Bars",
        video: `${ASSETS_BASE_URL}/videos/x22.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x22.1.jpg`,
        muscleGroups: ["chest","arms","abs","core"]
    },
    {
        id: "59",
        title: "Подъем ног на брусьях поочередно",
        titleEn: "Alternating Leg Raises on Bars",
        video: `${ASSETS_BASE_URL}/videos/x22.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x22.2.jpg`,
        muscleGroups: ["chest","arms","abs","core"]
    },
    {
        id: "60",
        title: "Уголок закрытый на брусьях",
        titleEn: "Closed L-sit on Bars",
        video: `${ASSETS_BASE_URL}/videos/x22.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x22.3.jpg`,
        muscleGroups: ["chest","arms","abs","core"]
    },
    {
        id: "61",
        title: "Выход на две",
        titleEn: "Muscle-up",
        video: `${ASSETS_BASE_URL}/videos/x23.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x23.1.jpg`,
        muscleGroups: ["complex","back","arms"]
    },
    {
        id: "62",
        title: "Подтягивания до груди",
        titleEn: "Chest Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x23.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x23.2.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "63",
        title: "Подтягивания Австралийские с подъема",
        titleEn: "Australian Pull-ups from Raise",
        video: `${ASSETS_BASE_URL}/videos/x23.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x23.3.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "64",
        title: "Отжимания от брусьев с выходом на локти",
        titleEn: "Dips to Elbow Support",
        video: `${ASSETS_BASE_URL}/videos/x24.1.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x24.1.1.jpg`,
        muscleGroups: ["complex","chest","arms"]
    },
    {
        id: "65",
        title: "Скручивания на брусьях",
        titleEn: "Crunches on Bars",
        video: `${ASSETS_BASE_URL}/videos/x24.2.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x24.2.1.jpg`,
        muscleGroups: ["chest","arms","abs","core"]
    },
    {
        id: "66",
        title: "Отжимнаия от брусьев с группировкой",
        titleEn: "Tucked Dips on Bars",
        video: `${ASSETS_BASE_URL}/videos/x24.3.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x24.3.1.jpg`,
        muscleGroups: ["chest","arms","abs"]
    },
    {
        id: "67",
        title: "Отжимания от турника",
        titleEn: "Pull-up Bar Dips",
        video: `${ASSETS_BASE_URL}/videos/x26.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x26.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "68",
        title: "Подтягвиаиния + вертикальный выход",
        titleEn: "Pull-ups + Vertical Exit",
        video: `${ASSETS_BASE_URL}/videos/x26.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x26.2.jpg`,
        muscleGroups: ["complex","back","arms"]
    },
    {
        id: "69",
        title: "Вис в уголке",
        titleEn: "L-sit Hang",
        video: `${ASSETS_BASE_URL}/videos/x26.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x26.3.jpg`,
        muscleGroups: ["complex","back","arms"]
    },
    {
        id: "70",
        title: "Вис в уголке динамично",
        titleEn: "Dynamic L-sit Hang",
        video: `${ASSETS_BASE_URL}/videos/x27.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x27.1.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "71",
        title: "Закрытый вис статично",
        titleEn: "Static Closed Hang",
        video: `${ASSETS_BASE_URL}/videos/x27.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x27.2.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "72",
        title: "Отжимания от брусьев + уголок",
        titleEn: "Dips + L-sit",
        video: `${ASSETS_BASE_URL}/videos/x27.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x27.3.jpg`,
        muscleGroups: ["complex","chest","arms","abs"]
    },
    {
        id: "73",
        title: "Отжимания с возвышенности",
        titleEn: "Elevated Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x27.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x27.4.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "74",
        title: "Выход в закрытую стойку",
        titleEn: "Closed Handstand Exit",
        video: `${ASSETS_BASE_URL}/videos/x28.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x28.1.jpg`,
        muscleGroups: ["complex","shoulders","core"]
    },
    {
        id: "75",
        title: "Отжимания в уголке на брусьях",
        titleEn: "L-sit Dips on Bars",
        video: `${ASSETS_BASE_URL}/videos/x28.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x28.2.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "76",
        title: "Стойка на руках с опорой",
        titleEn: "Supported Handstand",
        video: `${ASSETS_BASE_URL}/videos/x28.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x28.3.jpg`,
        muscleGroups: ["shoulders","arms","core"]
    },
    {
        id: "77",
        title: "Отжимания",
        titleEn: "Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x3.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x3.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "78",
        title: "Отжимания",
        titleEn: "Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x3.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x3.2.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "79",
        title: "Отжимания",
        titleEn: "Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x3.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x3.3.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "80",
        title: "Отжимания",
        titleEn: "Push-ups",
        video: `${ASSETS_BASE_URL}/videos/x3.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x3.4.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "81",
        title: "Подъем ног в висе динамично",
        titleEn: "Dynamic Hanging Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x3.jpg`,
        muscleGroups: ["abs"]
    },
    {
        id: "82",
        title: "Подтягивания до груди",
        titleEn: "Chest Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x30.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x30.2.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "83",
        title: "Отжимания от брусьев с вытянутыми ногами",
        titleEn: "Dips with Straight Legs",
        video: `${ASSETS_BASE_URL}/videos/x33.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x33.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "84",
        title: "Отжимания от брусьев с поджатыми ногами",
        titleEn: "Dips with Tucked Legs",
        video: `${ASSETS_BASE_URL}/videos/x33.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x33.2.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "85",
        title: "Отжимания от брусьев в прямой линии",
        titleEn: "Straight Line Dips on Bars",
        video: `${ASSETS_BASE_URL}/videos/x33.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x33.3.jpg`,
        muscleGroups: ["complex","chest","arms"]
    },
    {
        id: "86",
        title: "Выход в упор на брусьях",
        titleEn: "Support Hold Exit on Bars",
        video: `${ASSETS_BASE_URL}/videos/x4.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x4.1.jpg`,
        muscleGroups: ["complex","shoulders","back","core"]
    },
    {
        id: "87",
        title: "Махи ногами с локтей",
        titleEn: "Leg Swings from Elbows",
        video: `${ASSETS_BASE_URL}/videos/x4.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x4.2.jpg`,
        muscleGroups: ["complex","abs","abs","core"]
    },
    {
        id: "88",
        title: "Стойка на руках закрытая",
        titleEn: "Closed Handstand",
        video: `${ASSETS_BASE_URL}/videos/x4.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x4.3.jpg`,
        muscleGroups: ["complex","chest","core"]
    },
    {
        id: "89",
        title: "Выход в стойку на руках на брусьях",
        titleEn: "Handstand Exit on Bars",
        video: `${ASSETS_BASE_URL}/videos/x4.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x4.4.jpg`,
        muscleGroups: ["complex", "shoulders","core"]
    },
    {
        id: "90",
        title: "Вис + динамичный подъем ног",
        titleEn: "Hang + Dynamic Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x4.jpg`,
        muscleGroups: ["abs"]
    },
    {
        id: "91",
        title: "Подтягивания в уголке",
        titleEn: "L-sit Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x5.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x5.1.jpg`,
        muscleGroups: ["complex","back","arms","abs","legs"]
    },
    {
        id: "92",
        title: "Подтягивания Австралийские на брусьях",
        titleEn: "Australian Pull-ups on Bars",
        video: `${ASSETS_BASE_URL}/videos/x5.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x5.2.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "93",
        title: "Уголок с разворотом",
        titleEn: "L-sit with Rotation",
        video: `${ASSETS_BASE_URL}/videos/x5.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x5.3.jpg`,
        muscleGroups: ["abs","core"]
    },
    {
        id: "94",
        title: "Выход в вертикальный вис с группировки",
        titleEn: "Vertical Hang Exit from Tuck",
        video: `${ASSETS_BASE_URL}/videos/x5.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x5.4.jpg`,
        muscleGroups: ["complex","abs","arms"]
    },
    {
        id: "95",
        title: "Подтягивания в уголке",
        titleEn: "L-sit Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x51.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x51.jpg`,
        muscleGroups: ["complex","back","arms","abs"]
    },
    {
        id: "96",
        title: "Выход на две с резиной",
        titleEn: "Muscle-up with Resistance Band",
        video: `${ASSETS_BASE_URL}/videos/x6.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x6.1.jpg`,
        muscleGroups: ["back","chest","arms"]
    },
    {
        id: "97",
        title: "Подтягивания с группировкой",
        titleEn: "Tucked Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x6.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x6.2.jpg`,
        muscleGroups: ["back","abs","arms"]
    },
    {
        id: "98",
        title: "Подтягивания высокие под углом с резиной",
        titleEn: "High Angle Pull-ups with Resistance Band",
        video: `${ASSETS_BASE_URL}/videos/x6.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x6.3.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "99",
        title: "Подъем ног с группировкой высокий",
        titleEn: "High Tucked Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x6.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x6.4.jpg`,
        muscleGroups: ["abs"]
    },
    {
        id: "100",
        title: "Подъем ног с группировкой высокий",
        titleEn: "High Tucked Leg Raise",
        video: `${ASSETS_BASE_URL}/videos/x7.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x7.1.jpg`,
        muscleGroups: ["back","arms","abs","core"]
    },
    {
        id: "101",
        title: "Подъем ног + вертикальный выход",
        titleEn: "Leg Raise + Vertical Exit",
        video: `${ASSETS_BASE_URL}/videos/x7.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x7.2.jpg`,
        muscleGroups: ["abs"]
    },
    {
        id: "102",
        title: "Закрытый вис динамично",
        titleEn: "Dynamic Closed Hang",
        video: `${ASSETS_BASE_URL}/videos/x7.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x7.3.jpg`,
        muscleGroups: ["abs","back"]
    },
    {
        id: "103",
        title: "Вис закрытый",
        titleEn: "Closed Hang",
        video: `${ASSETS_BASE_URL}/videos/x7.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x7.4.jpg`,
        muscleGroups: ["abs","back"]
    },
    {
        id: "104",
        title: "Отжимания от брусьев с подъемом таза",
        titleEn: "Dips with Hip Raise",
        video: `${ASSETS_BASE_URL}/videos/x8.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x8.1.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "105",
        title: "Планш закрытый динамично",
        titleEn: "Dynamic Closed Planche",
        video: `${ASSETS_BASE_URL}/videos/x8.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x8.2.jpg`,
        muscleGroups: ["shoulders","abs","core"]
    },
    {
        id: "106",
        title: "Скручивания на брусьях",
        titleEn: "Crunches on Bars",
        video: `${ASSETS_BASE_URL}/videos/x8.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x8.3.jpg`,
        muscleGroups: ["abs"]
    },
    {
        id: "107",
        title: "Отжимания от брусьев взрывные",
        titleEn: "Explosive Dips on Bars",
        video: `${ASSETS_BASE_URL}/videos/x8.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x8.4.jpg`,
        muscleGroups: ["chest","arms"]
    },
    {
        id: "108",
        title: "Подъем с переворотом",
        titleEn: "Rolling Pull-up",
        video: `${ASSETS_BASE_URL}/videos/x9.1.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x9.1.jpg`,
        muscleGroups: ["complex","core"]
    },
    {
        id: "109",
        title: "Подтягивания Австралийские",
        titleEn: "Australian Pull-ups",
        video: `${ASSETS_BASE_URL}/videos/x9.2.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x9.2.jpg`,
        muscleGroups: ["back","arms"]
    },
    {
        id: "110",
        title: "Выход на две с резиной",
        titleEn: "Muscle-up with Resistance Band",
        video: `${ASSETS_BASE_URL}/videos/x9.3.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x9.3.jpg`,
        muscleGroups: ["complex","back","arms"]
    },
    {
        id: "111",
        title: "Выход вертикально с резиной",
        titleEn: "Vertical Exit with Resistance Band",
        video: `${ASSETS_BASE_URL}/videos/x9.4.mp4`,
        poster: `${ASSETS_BASE_URL}/posters/x9.4.jpg`,
        muscleGroups: ["complex","abs","back"]
    }
]
