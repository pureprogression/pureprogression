/**
 * Заполнение всех упражнений правильными названиями
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');
let content = fs.readFileSync(exercisesFile, 'utf8');

// Читаем все упражнения из файла
const exerciseRegex = /{\s*id:\s*"(\d+)"[\s\S]*?video:.*?\/videos\/([^"']+\.mp4)[\s\S]*?title:\s*"([^"]+)"[\s\S]*?muscleGroups:\s*(\[[^\]]*\])/g;

const exercises = [];
let match;

while ((match = exerciseRegex.exec(content)) !== null) {
  exercises.push({
    id: match[1],
    videoFile: match[2],
    currentTitle: match[3],
    currentGroups: match[4],
    fullMatch: match[0]
  });
}

// Маппинг имен файлов на названия и группы мышц
function getExerciseInfo(videoFile) {
  const name = videoFile.replace('.mp4', '');
  
  // Точные совпадения
  const exactMatches = {
    'x92': { title: 'Australian Pull-ups', groups: ['back', 'arms'] },
    'x93': { title: 'Band Muscle-Ups', groups: ['back', 'arms'] },
    'x51web': { title: 'L Pull-ups', groups: ['back', 'abs', 'arms', 'core'] },
    'x51': { title: 'L Pull-ups', groups: ['back', 'abs', 'arms', 'core'] },
    'x72': { title: 'Core Pull-ups', groups: ['abs'] },
    'x102': { title: 'Squats', groups: ['legs', 'glutes'] },
    'x113': { title: 'Handstand', groups: ['shoulders', 'arms', 'core', 'abs'] },
    'x84': { title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
    'x124': { title: 'Decline Push-ups', groups: ['chest', 'shoulders'] },
    'x32': { title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
  };
  
  if (exactMatches[name]) {
    return exactMatches[name];
  }
  
  // Паттерны с номерами (x29.1, x29.2, etc.)
  const patternMatches = {
    'x29': { base: 'Pull-ups', groups: ['back', 'arms'] },
    'x30': { base: 'Chin-ups', groups: ['back', 'arms'] },
    'x31': { base: 'Wide Pull-ups', groups: ['back', 'arms'] },
    'x32': { base: 'Close Grip Pull-ups', groups: ['back', 'arms'] },
    'x3': { base: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
    'x4': { base: 'Diamond Push-ups', groups: ['chest', 'arms'] },
    'x5': { base: 'Wide Push-ups', groups: ['chest', 'shoulders'] },
    'x6': { base: 'Decline Push-ups', groups: ['chest', 'shoulders'] },
    'x7': { base: 'Incline Push-ups', groups: ['chest', 'shoulders'] },
    'x8': { base: 'Archer Push-ups', groups: ['chest', 'arms'] },
    'x9': { base: 'Pike Push-ups', groups: ['shoulders', 'arms'] },
    'x10': { base: 'Squats', groups: ['legs', 'glutes'] },
    'x11': { base: 'Lunges', groups: ['legs', 'glutes'] },
    'x12': { base: 'Jump Squats', groups: ['legs', 'glutes'] },
    'x13': { base: 'Bulgarian Split Squats', groups: ['legs', 'glutes'] },
    'x15': { base: 'Calf Raises', groups: ['legs'] },
    'x16': { base: 'Leg Raises', groups: ['abs', 'legs'] },
    'x17': { base: 'Pistol Squats', groups: ['legs', 'glutes'] },
    'x18': { base: 'Wall Sits', groups: ['legs', 'glutes'] },
    'x21': { base: 'Plank', groups: ['core', 'abs'] },
    'x22': { base: 'Side Plank', groups: ['core', 'abs'] },
    'x23': { base: 'Mountain Climbers', groups: ['core', 'abs'] },
    'x24': { base: 'Russian Twists', groups: ['core', 'abs'] },
    'x26': { base: 'Crunches', groups: ['abs'] },
    'x27': { base: 'Bicycle Crunches', groups: ['abs', 'core'] },
    'x28': { base: 'Hanging Leg Raises', groups: ['abs', 'core'] },
    'x33': { base: 'Dead Bug', groups: ['core', 'abs'] },
    'x1': { base: 'Dips', groups: ['arms', 'shoulders'] },
    'x2': { base: 'Handstand Push-ups', groups: ['shoulders', 'arms', 'core'] },
    'x.1': { base: 'Burpees', groups: ['legs', 'chest', 'arms', 'core'] },
    'x.2': { base: 'Jumping Jacks', groups: ['legs', 'shoulders'] },
    'x.3': { base: 'High Knees', groups: ['legs', 'core'] },
    'x.4': { base: 'Bear Crawl', groups: ['core', 'shoulders', 'legs'] },
  };
  
  // Проверяем паттерны (x29.1 -> Pull-ups 1)
  for (const [pattern, info] of Object.entries(patternMatches)) {
    // Проверяем точное совпадение или начало с паттерном
    if (name === pattern || name.startsWith(pattern + '.')) {
      // Извлекаем номер вариации
      const variationMatch = name.match(new RegExp(`^${pattern.replace('.', '\\.')}\\.(\\d+)`));
      if (variationMatch) {
        return {
          title: `${info.base} ${variationMatch[1]}`,
          groups: info.groups
        };
      }
      // Если нет номера, просто базовое название
      return info;
    }
  }
  
  // Если не найдено, используем общее название
  return {
    title: 'Bodyweight Exercise',
    groups: ['core']
  };
}

// Обновляем все упражнения
let updatedCount = 0;
exercises.forEach(ex => {
  const info = getExerciseInfo(ex.videoFile);
  
  // Пропускаем уже правильно заполненные (не начинающиеся с "Exercise", "Bodyweight", "Pike Push-ups Variation")
  if (!ex.currentTitle.startsWith('Exercise') && 
      ex.currentTitle !== 'Bodyweight Exercise' && 
      !ex.currentTitle.includes('Variation 2') &&
      ex.currentTitle !== 'Pike Push-ups Variation 2') {
    return;
  }
  
  const newTitle = `title: "${info.title}"`;
  const newGroups = `muscleGroups: ${JSON.stringify(info.groups)}`;
  
  const newBlock = ex.fullMatch
    .replace(/title:\s*"[^"]+"/, newTitle)
    .replace(/muscleGroups:\s*\[[^\]]*\]/, newGroups);
  
  content = content.replace(ex.fullMatch, newBlock);
  updatedCount++;
});

// Сохраняем
fs.writeFileSync(exercisesFile, content, 'utf8');

console.log(`\n✅ Обновлено ${updatedCount} упражнений\n`);
console.log('💡 Все упражнения теперь имеют названия и группы мышц\n');

