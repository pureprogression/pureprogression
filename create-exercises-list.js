/**
 * Создание полного списка всех упражнений для заполнения
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');
const content = fs.readFileSync(exercisesFile, 'utf8');

// Извлекаем все упражнения более надежным способом
const exercises = [];
let currentId = null;
let currentVideo = null;
let currentTitle = null;
let currentGroups = null;

// Разбиваем на строки и парсим
const lines = content.split('\n');
let inExercise = false;
let exerciseData = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // Начало упражнения
  if (line.match(/^id:\s*"(\d+)"/)) {
    if (exerciseData.id) {
      exercises.push(exerciseData);
    }
    exerciseData = { id: line.match(/^id:\s*"(\d+)"/)[1] };
  }
  
  // Видео
  if (line.includes('video:') && line.includes('/videos/')) {
    const match = line.match(/\/videos\/([^"']+\.mp4)/);
    if (match) {
      exerciseData.video = match[1];
    }
  }
  
  // Название
  if (line.match(/^title:\s*"([^"]+)"/)) {
    exerciseData.title = line.match(/^title:\s*"([^"]+)"/)[1];
  }
  
  // Группы мышц
  if (line.match(/^muscleGroups:\s*(\[[^\]]*\])/)) {
    exerciseData.groups = line.match(/^muscleGroups:\s*(\[[^\]]*\])/)[1];
  }
}

// Добавляем последнее упражнение
if (exerciseData.id) {
  exercises.push(exerciseData);
}

// Сортируем по ID
exercises.sort((a, b) => parseInt(a.id) - parseInt(b.id));

// Формируем вывод
const output = exercises.map(ex => {
  const id = String(ex.id).padStart(3, ' ');
  const video = (ex.video || '???').padEnd(20);
  const title = (ex.title || '???').padEnd(35);
  return `${id} | ${video} | ${title} | [ЗАПОЛНИТЕ ГРУППЫ МЫШЦ]`;
}).join('\n');

const header = `# Формат: ID | Видео файл | Текущее название | Группы мышц (через запятую)
# Пример: 10 | x29.1.mp4 | Pull-ups | back,arms
#
# Заполните названия и группы мышц для каждого упражнения ниже:
# (Замените [ЗАПОЛНИТЕ ГРУППЫ МЫШЦ] на группы мышц через запятую)
# Доступные группы: back, arms, chest, shoulders, legs, glutes, abs, core
#
`;

fs.writeFileSync('exercises-to-fill.txt', header + output, 'utf8');

console.log(`\n✅ Создан файл exercises-to-fill.txt с ${exercises.length} упражнениями\n`);
console.log('📝 Теперь заполните файл exercises-to-fill.txt:');
console.log('   1. Замените названия упражнений (если нужно)');
console.log('   2. Замените [ЗАПОЛНИТЕ ГРУППЫ МЫШЦ] на группы мышц через запятую');
console.log('   3. Сохраните файл');
console.log('   4. Запустите: node apply-exercises.js\n');

