/**
 * Замена всех неправильных названий на правильные
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
  
  // Паттерны
  const patterns = [
    { regex: /^x29\.(\d+)$/, title: 'Pull-ups', groups: ['back', 'arms'] },
    { regex: /^x30\.(\d+)$/, title: 'Chin-ups', groups: ['back', 'arms'] },
    { regex: /^x31\.(\d+)$/, title: 'Wide Pull-ups', groups: ['back', 'arms'] },
    { regex: /^x32\.(\d+)$/, title: 'Close Grip Pull-ups', groups: ['back', 'arms'] },
    { regex: /^x3\.(\d+)$/, title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
    { regex: /^x4\.(\d+)$/, title: 'Diamond Push-ups', groups: ['chest', 'arms'] },
    { regex: /^x5\.(\d+)$/, title: 'Wide Push-ups', groups: ['chest', 'shoulders'] },
    { regex: /^x6\.(\d+)$/, title: 'Decline Push-ups', groups: ['chest', 'shoulders'] },
    { regex: /^x7\.(\d+)$/, title: 'Incline Push-ups', groups: ['chest', 'shoulders'] },
    { regex: /^x8\.(\d+)$/, title: 'Archer Push-ups', groups: ['chest', 'arms'] },
    { regex: /^x9\.(\d+)$/, title: 'Pike Push-ups', groups: ['shoulders', 'arms'] },
    { regex: /^x10\.(\d+)$/, title: 'Squats', groups: ['legs', 'glutes'] },
    { regex: /^x11\.(\d+)$/, title: 'Lunges', groups: ['legs', 'glutes'] },
    { regex: /^x12\.(\d+)$/, title: 'Jump Squats', groups: ['legs', 'glutes'] },
    { regex: /^x13\.(\d+)$/, title: 'Bulgarian Split Squats', groups: ['legs', 'glutes'] },
    { regex: /^x15\.(\d+)$/, title: 'Calf Raises', groups: ['legs'] },
    { regex: /^x16\.(\d+)$/, title: 'Leg Raises', groups: ['abs', 'legs'] },
    { regex: /^x17\.(\d+)$/, title: 'Pistol Squats', groups: ['legs', 'glutes'] },
    { regex: /^x18\.(\d+)$/, title: 'Wall Sits', groups: ['legs', 'glutes'] },
    { regex: /^x21\.(\d+)$/, title: 'Plank', groups: ['core', 'abs'] },
    { regex: /^x22\.(\d+)$/, title: 'Side Plank', groups: ['core', 'abs'] },
    { regex: /^x23\.(\d+)$/, title: 'Mountain Climbers', groups: ['core', 'abs'] },
    { regex: /^x24\.(\d+)\.(\d+)$/, title: 'Russian Twists', groups: ['core', 'abs'] },
    { regex: /^x26\.(\d+)$/, title: 'Crunches', groups: ['abs'] },
    { regex: /^x27\.(\d+)$/, title: 'Bicycle Crunches', groups: ['abs', 'core'] },
    { regex: /^x28\.(\d+)$/, title: 'Hanging Leg Raises', groups: ['abs', 'core'] },
    { regex: /^x33\.(\d+)$/, title: 'Dead Bug', groups: ['core', 'abs'] },
    { regex: /^x\.1\.(\d+)$/, title: 'Burpees', groups: ['legs', 'chest', 'arms', 'core'] },
    { regex: /^x\.2\.(\d+)$/, title: 'Jumping Jacks', groups: ['legs', 'shoulders'] },
    { regex: /^x\.3\.(\d+)$/, title: 'High Knees', groups: ['legs', 'core'] },
    { regex: /^x\.4\.(\d+)$/, title: 'Bear Crawl', groups: ['core', 'shoulders', 'legs'] },
    { regex: /^x1$/, title: 'Dips', groups: ['arms', 'shoulders'] },
    { regex: /^x2$/, title: 'Handstand Push-ups', groups: ['shoulders', 'arms', 'core'] },
    { regex: /^x3$/, title: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
    { regex: /^x4$/, title: 'Diamond Push-ups', groups: ['chest', 'arms'] },
  ];
  
  for (const { regex, title, groups } of patterns) {
    const match = name.match(regex);
    if (match) {
      const variation = match[1] || match[2];
      if (variation) {
        return {
          title: `${title} ${variation}`,
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

// Заменяем все неправильные названия
const wrongTitles = ['Pike Push-ups Variation 2', 'Bodyweight Exercise'];
let updated = 0;

wrongTitles.forEach(wrongTitle => {
  const regex = new RegExp(`(title:\\s*"${wrongTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[\\s\\S]*?video:.*?\\/videos\\/([^"']+\\.mp4)[\\s\\S]*?muscleGroups:\\s*)(\\[[^\\]]*\\])`, 'g');
  
  content = content.replace(regex, (match, prefix, videoFile, oldGroups) => {
    const info = getExerciseInfo(videoFile);
    updated++;
    return prefix + JSON.stringify(info.groups);
  });
  
  // Также заменяем title
  const titleRegex = new RegExp(`title:\\s*"${wrongTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
  content = content.replace(titleRegex, (match, offset) => {
    // Находим соответствующий video файл
    const beforeMatch = content.substring(Math.max(0, offset - 500), offset);
    const videoMatch = beforeMatch.match(/video:.*?\/videos\/([^"']+\.mp4)/);
    if (videoMatch) {
      const videoFile = videoMatch[1];
      const info = getExerciseInfo(videoFile);
      return `title: "${info.title}"`;
    }
    return match;
  });
});

// Дополнительная замена: находим все блоки с неправильными названиями и заменяем
const blockRegex = /title:\s*"(Pike Push-ups Variation 2|Bodyweight Exercise)"[\s\S]*?video:.*?\/videos\/([^"']+\.mp4)[\s\S]*?muscleGroups:\s*(\[[^\]]*\])/g;

content = content.replace(blockRegex, (match, wrongTitle, videoFile, oldGroups) => {
  const info = getExerciseInfo(videoFile);
  return match
    .replace(wrongTitle, info.title)
    .replace(oldGroups, JSON.stringify(info.groups));
});

fs.writeFileSync(exercisesFile, content, 'utf8');

console.log(`\n✅ Заменено все неправильные названия\n`);

