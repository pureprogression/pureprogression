/**
 * Финальное исправление всех названий упражнений
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');
let content = fs.readFileSync(exercisesFile, 'utf8');

// Функция для определения названия по имени файла
function getExerciseInfo(videoFile) {
  const name = videoFile.replace('.mp4', '');
  
  // Точные совпадения
  const exactMap = {
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
  
  if (exactMap[name]) {
    return exactMap[name];
  }
  
  // Паттерны с вариациями
  const patterns = [
    { pattern: /^x29\./, title: 'Pull-ups', groups: ['back', 'arms'] },
    { pattern: /^x30\./, title: 'Chin-ups', groups: ['back', 'arms'] },
    { pattern: /^x31\./, title: 'Wide Pull-ups', groups: ['back', 'arms'] },
    { pattern: /^x32\./, title: 'Close Grip Pull-ups', groups: ['back', 'arms'] },
    { pattern: /^x3\./, title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
    { pattern: /^x4\./, title: 'Diamond Push-ups', groups: ['chest', 'arms'] },
    { pattern: /^x5\./, title: 'Wide Push-ups', groups: ['chest', 'shoulders'] },
    { pattern: /^x6\./, title: 'Decline Push-ups', groups: ['chest', 'shoulders'] },
    { pattern: /^x7\./, title: 'Incline Push-ups', groups: ['chest', 'shoulders'] },
    { pattern: /^x8\./, title: 'Archer Push-ups', groups: ['chest', 'arms'] },
    { pattern: /^x9\./, title: 'Pike Push-ups', groups: ['shoulders', 'arms'] },
    { pattern: /^x10\./, title: 'Squats', groups: ['legs', 'glutes'] },
    { pattern: /^x11\./, title: 'Lunges', groups: ['legs', 'glutes'] },
    { pattern: /^x12\./, title: 'Jump Squats', groups: ['legs', 'glutes'] },
    { pattern: /^x13\./, title: 'Bulgarian Split Squats', groups: ['legs', 'glutes'] },
    { pattern: /^x15\./, title: 'Calf Raises', groups: ['legs'] },
    { pattern: /^x16\./, title: 'Leg Raises', groups: ['abs', 'legs'] },
    { pattern: /^x17\./, title: 'Pistol Squats', groups: ['legs', 'glutes'] },
    { pattern: /^x18\./, title: 'Wall Sits', groups: ['legs', 'glutes'] },
    { pattern: /^x21\./, title: 'Plank', groups: ['core', 'abs'] },
    { pattern: /^x22\./, title: 'Side Plank', groups: ['core', 'abs'] },
    { pattern: /^x23\./, title: 'Mountain Climbers', groups: ['core', 'abs'] },
    { pattern: /^x24\./, title: 'Russian Twists', groups: ['core', 'abs'] },
    { pattern: /^x26\./, title: 'Crunches', groups: ['abs'] },
    { pattern: /^x27\./, title: 'Bicycle Crunches', groups: ['abs', 'core'] },
    { pattern: /^x28\./, title: 'Hanging Leg Raises', groups: ['abs', 'core'] },
    { pattern: /^x33\./, title: 'Dead Bug', groups: ['core', 'abs'] },
    { pattern: /^x\.1\./, title: 'Burpees', groups: ['legs', 'chest', 'arms', 'core'] },
    { pattern: /^x\.2\./, title: 'Jumping Jacks', groups: ['legs', 'shoulders'] },
    { pattern: /^x\.3\./, title: 'High Knees', groups: ['legs', 'core'] },
    { pattern: /^x\.4\./, title: 'Bear Crawl', groups: ['core', 'shoulders', 'legs'] },
    { pattern: /^x1$/, title: 'Dips', groups: ['arms', 'shoulders'] },
    { pattern: /^x2$/, title: 'Handstand Push-ups', groups: ['shoulders', 'arms', 'core'] },
    { pattern: /^x3$/, title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
    { pattern: /^x4$/, title: 'Diamond Push-ups', groups: ['chest', 'arms'] },
  ];
  
  for (const { pattern, title, groups } of patterns) {
    if (pattern.test(name)) {
      // Извлекаем номер вариации
      const numMatch = name.match(/\.(\d+)$/);
      if (numMatch) {
        return {
          title: `${title} ${numMatch[1]}`,
          groups
        };
      }
      return { title, groups };
    }
  }
  
  return {
    title: 'Bodyweight Exercise',
    groups: ['core']
  };
}

// Находим и заменяем все упражнения
const blockRegex = /{\s*id:\s*"(\d+)"[\s\S]*?video:.*?\/videos\/([^"']+\.mp4)[\s\S]*?title:\s*"([^"]+)"[\s\S]*?muscleGroups:\s*(\[[^\]]*\])/g;

let updated = 0;
const replacements = [];

while ((match = blockRegex.exec(content)) !== null) {
  const videoFile = match[2];
  const currentTitle = match[3];
  
  // Обновляем все, кроме уже правильно заполненных (первые 9)
  if (match[1] <= '9') {
    continue;
  }
  
  const info = getExerciseInfo(videoFile);
  
  const newTitle = `title: "${info.title}"`;
  const newGroups = `muscleGroups: ${JSON.stringify(info.groups)}`;
  
  const newBlock = match[0]
    .replace(/title:\s*"[^"]+"/, newTitle)
    .replace(/muscleGroups:\s*\[[^\]]*\]/, newGroups);
  
  replacements.push({ old: match[0], new: newBlock });
  updated++;
}

// Применяем замены в обратном порядке
replacements.reverse().forEach(({ old, new: newBlock }) => {
  content = content.replace(old, newBlock);
});

fs.writeFileSync(exercisesFile, content, 'utf8');

console.log(`\n✅ Обновлено ${updated} упражнений\n`);

