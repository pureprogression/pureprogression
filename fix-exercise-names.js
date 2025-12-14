/**
 * Исправление названий упражнений на основе паттернов имен файлов
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');
let content = fs.readFileSync(exercisesFile, 'utf8');

// Маппинг паттернов имен файлов на названия и группы мышц
const exerciseMap = {
  // Pull-ups
  'x29': { title: 'Pull-ups', groups: ['back', 'arms'] },
  'x30': { title: 'Chin-ups', groups: ['back', 'arms'] },
  'x31': { title: 'Wide Pull-ups', groups: ['back', 'arms'] },
  'x32': { title: 'Close Grip Pull-ups', groups: ['back', 'arms'] },
  'x51': { title: 'L Pull-ups', groups: ['back', 'abs', 'arms', 'core'] },
  'x92': { title: 'Australian Pull-ups', groups: ['back', 'arms'] },
  'x93': { title: 'Band Muscle-Ups', groups: ['back', 'arms'] },
  
  // Push-ups
  'x3': { title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
  'x4': { title: 'Diamond Push-ups', groups: ['chest', 'arms'] },
  'x5': { title: 'Wide Push-ups', groups: ['chest', 'shoulders'] },
  'x6': { title: 'Decline Push-ups', groups: ['chest', 'shoulders'] },
  'x7': { title: 'Incline Push-ups', groups: ['chest', 'shoulders'] },
  'x8': { title: 'Archer Push-ups', groups: ['chest', 'arms'] },
  'x9': { title: 'Pike Push-ups', groups: ['shoulders', 'arms'] },
  'x84': { title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
  'x124': { title: 'Decline Push-ups', groups: ['chest', 'shoulders'] },
  
  // Legs
  'x10': { title: 'Squats', groups: ['legs', 'glutes'] },
  'x11': { title: 'Lunges', groups: ['legs', 'glutes'] },
  'x12': { title: 'Jump Squats', groups: ['legs', 'glutes'] },
  'x13': { title: 'Bulgarian Split Squats', groups: ['legs', 'glutes'] },
  'x15': { title: 'Calf Raises', groups: ['legs'] },
  'x16': { title: 'Leg Raises', groups: ['abs', 'legs'] },
  'x17': { title: 'Pistol Squats', groups: ['legs', 'glutes'] },
  'x18': { title: 'Wall Sits', groups: ['legs', 'glutes'] },
  'x102': { title: 'Squats', groups: ['legs', 'glutes'] },
  
  // Core/Abs
  'x21': { title: 'Plank', groups: ['core', 'abs'] },
  'x22': { title: 'Side Plank', groups: ['core', 'abs'] },
  'x23': { title: 'Mountain Climbers', groups: ['core', 'abs'] },
  'x24': { title: 'Russian Twists', groups: ['core', 'abs'] },
  'x26': { title: 'Crunches', groups: ['abs'] },
  'x27': { title: 'Bicycle Crunches', groups: ['abs', 'core'] },
  'x28': { title: 'Hanging Leg Raises', groups: ['abs', 'core'] },
  'x33': { title: 'Dead Bug', groups: ['core', 'abs'] },
  'x72': { title: 'Core Pull-ups', groups: ['abs'] },
  
  // Other
  'x1': { title: 'Dips', groups: ['arms', 'shoulders'] },
  'x2': { title: 'Handstand Push-ups', groups: ['shoulders', 'arms', 'core'] },
  'x113': { title: 'Handstand', groups: ['shoulders', 'arms', 'core', 'abs'] },
  'x.1': { title: 'Burpees', groups: ['legs', 'chest', 'arms', 'core'] },
  'x.2': { title: 'Jumping Jacks', groups: ['legs', 'shoulders'] },
  'x.3': { title: 'High Knees', groups: ['legs', 'core'] },
  'x.4': { title: 'Bear Crawl', groups: ['core', 'shoulders', 'legs'] },
};

// Функция для определения названия по имени файла
function getExerciseInfo(videoFile) {
  const name = videoFile.replace('.mp4', '');
  
  // Проверяем точные совпадения
  if (exerciseMap[name]) {
    return exerciseMap[name];
  }
  
  // Проверяем паттерны (x29.1 -> x29)
  for (const [pattern, info] of Object.entries(exerciseMap)) {
    if (name.startsWith(pattern + '.') || name === pattern) {
      // Добавляем номер вариации если есть
      const variationMatch = name.match(new RegExp(`^${pattern.replace('.', '\\.')}\\.(\\d+)`));
      if (variationMatch) {
        return {
          title: `${info.title} ${variationMatch[1]}`,
          groups: info.groups
        };
      }
      return info;
    }
  }
  
  // Если не найдено, используем общее название
  return {
    title: 'Bodyweight Exercise',
    groups: ['core']
  };
}

// Находим все упражнения и обновляем их
const exerciseBlockRegex = /{\s*id:\s*"(\d+)"[\s\S]*?video:.*?\/videos\/([^"']+\.mp4)[\s\S]*?title:\s*"([^"]+)"[\s\S]*?muscleGroups:\s*(\[[^\]]*\])/g;

let updatedCount = 0;
const replacements = [];

let match;
while ((match = exerciseBlockRegex.exec(content)) !== null) {
  const id = match[1];
  const videoFile = match[2];
  const currentTitle = match[3];
  const currentGroups = match[4];
  
  // Пропускаем уже заполненные упражнения (не начинающиеся с "Exercise")
  if (!currentTitle.startsWith('Exercise') && currentTitle !== 'Bodyweight Exercise' && currentTitle !== 'Pike Push-ups Variation 2') {
    continue;
  }
  
  const info = getExerciseInfo(videoFile);
  
  // Создаем замену
  const oldBlock = match[0];
  const newTitle = `title: "${info.title}"`;
  const newGroups = `muscleGroups: ${JSON.stringify(info.groups)}`;
  
  const newBlock = oldBlock.replace(/title:\s*"[^"]+"/, newTitle).replace(/muscleGroups:\s*\[[^\]]*\]/, newGroups);
  
  replacements.push({ old: oldBlock, new: newBlock });
  updatedCount++;
}

// Применяем замены
replacements.forEach(({ old, new: newBlock }) => {
  content = content.replace(old, newBlock);
});

// Сохраняем
fs.writeFileSync(exercisesFile, content, 'utf8');

console.log(`\n✅ Обновлено ${updatedCount} упражнений\n`);

