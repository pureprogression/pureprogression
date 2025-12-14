/**
 * Быстрое заполнение упражнений типичными названиями
 * Можно будет скорректировать позже
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');
let content = fs.readFileSync(exercisesFile, 'utf8');

// Типичные названия упражнений и группы мышц
// Распределяем по паттернам имен файлов
const exerciseTemplates = {
  // Pull-ups вариации
  'x29': { base: 'Pull-ups', groups: ['back', 'arms'] },
  'x30': { base: 'Chin-ups', groups: ['back', 'arms'] },
  'x31': { base: 'Wide Pull-ups', groups: ['back', 'arms'] },
  'x32': { base: 'Close Grip Pull-ups', groups: ['back', 'arms'] },
  'x51': { base: 'L Pull-ups', groups: ['back', 'abs', 'arms', 'core'] },
  
  // Push-ups вариации
  'x3': { base: 'Push-ups', groups: ['chest', 'shoulders', 'arms'] },
  'x4': { base: 'Diamond Push-ups', groups: ['chest', 'arms'] },
  'x5': { base: 'Wide Push-ups', groups: ['chest', 'shoulders'] },
  'x6': { base: 'Decline Push-ups', groups: ['chest', 'shoulders'] },
  'x7': { base: 'Incline Push-ups', groups: ['chest', 'shoulders'] },
  'x8': { base: 'Archer Push-ups', groups: ['chest', 'arms'] },
  'x9': { base: 'Pike Push-ups', groups: ['shoulders', 'arms'] },
  
  // Ноги
  'x10': { base: 'Squats', groups: ['legs', 'glutes'] },
  'x11': { base: 'Lunges', groups: ['legs', 'glutes'] },
  'x12': { base: 'Jump Squats', groups: ['legs', 'glutes'] },
  'x13': { base: 'Bulgarian Split Squats', groups: ['legs', 'glutes'] },
  'x15': { base: 'Calf Raises', groups: ['legs'] },
  'x16': { base: 'Leg Raises', groups: ['abs', 'legs'] },
  'x17': { base: 'Pistol Squats', groups: ['legs', 'glutes'] },
  'x18': { base: 'Wall Sits', groups: ['legs', 'glutes'] },
  
  // Core/Abs
  'x21': { base: 'Plank', groups: ['core', 'abs'] },
  'x22': { base: 'Side Plank', groups: ['core', 'abs'] },
  'x23': { base: 'Mountain Climbers', groups: ['core', 'abs'] },
  'x24': { base: 'Russian Twists', groups: ['core', 'abs'] },
  'x26': { base: 'Crunches', groups: ['abs'] },
  'x27': { base: 'Bicycle Crunches', groups: ['abs', 'core'] },
  'x28': { base: 'Hanging Leg Raises', groups: ['abs', 'core'] },
  'x33': { base: 'Dead Bug', groups: ['core', 'abs'] },
  
  // Другие
  'x1': { base: 'Dips', groups: ['arms', 'shoulders'] },
  'x2': { base: 'Handstand Push-ups', groups: ['shoulders', 'arms', 'core'] },
  'x.1': { base: 'Burpees', groups: ['legs', 'chest', 'arms', 'core'] },
  'x.2': { base: 'Jumping Jacks', groups: ['legs', 'shoulders'] },
  'x.3': { base: 'High Knees', groups: ['legs', 'core'] },
  'x.4': { base: 'Bear Crawl', groups: ['core', 'shoulders', 'legs'] },
};

// Функция для определения названия и групп мышц по имени файла
function getExerciseInfo(videoFile) {
  // Убираем расширение
  const name = videoFile.replace('.mp4', '');
  
  // Проверяем паттерны
  for (const [pattern, template] of Object.entries(exerciseTemplates)) {
    if (name.startsWith(pattern) || name.includes(pattern)) {
      // Если есть номер вариации (x29.1, x29.2)
      const match = name.match(new RegExp(`^${pattern.replace('.', '\\.')}\\.?(\\d+)?`));
      if (match) {
        const variation = match[1] ? ` Variation ${match[1]}` : '';
        return {
          title: `${template.base}${variation}`,
          groups: template.groups
        };
      }
    }
  }
  
  // Если не найдено, используем общее название
  return {
    title: 'Bodyweight Exercise',
    groups: ['core']
  };
}

// Заменяем все placeholder названия
let updatedCount = 0;
const placeholderRegex = /title:\s*"Exercise\s+([^"]+)"/g;

content = content.replace(placeholderRegex, (match, exerciseName) => {
  // Находим соответствующий video файл
  const videoMatch = content.substring(0, content.indexOf(match)).match(/video:.*?\/videos\/([^"']+\.mp4)/);
  if (videoMatch) {
    const videoFile = videoMatch[1];
    const info = getExerciseInfo(videoFile);
    updatedCount++;
    return `title: "${info.title}"`;
  }
  return match;
});

// Заменяем пустые muscleGroups
const emptyGroupsRegex = /muscleGroups:\s*\[\]/g;
let groupsUpdatedCount = 0;

content = content.replace(emptyGroupsRegex, (match, offset) => {
  // Находим соответствующий video файл перед этим местом
  const beforeMatch = content.substring(0, offset);
  const videoMatch = beforeMatch.match(/video:.*?\/videos\/([^"']+\.mp4)/);
  if (videoMatch) {
    const videoFile = videoMatch[1];
    const info = getExerciseInfo(videoFile);
    groupsUpdatedCount++;
    return `muscleGroups: ${JSON.stringify(info.groups)}`;
  }
  return match;
});

// Сохраняем обновленный файл
fs.writeFileSync(exercisesFile, content, 'utf8');

console.log('\n✅ Быстрое заполнение завершено!');
console.log(`📝 Обновлено названий: ${updatedCount}`);
console.log(`💪 Обновлено групп мышц: ${groupsUpdatedCount}`);
console.log('\n💡 Примечание: Названия основаны на типичных паттернах.');
console.log('   Вы можете скорректировать их позже, просмотрев видео.\n');

