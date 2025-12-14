const fs = require('fs');
const path = require('path');

const videosDir = path.join(__dirname, 'public', 'videos');
const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');

// Читаем текущий exercises.js
let exercisesContent = fs.readFileSync(exercisesFile, 'utf8');

// Получаем список всех видео (кроме служебных)
const allVideos = fs.readdirSync(videosDir)
  .filter(file => file.endsWith('.mp4'))
  .filter(file => !['FavVid.mp4', 'FavVid_mobile.mp4', 'webHero.mp4', 'webHeroAuth.mp4', 'webHeroAuth_original.mp4', 'work60.mp4'].includes(file))
  .sort();

// Извлекаем уже добавленные видео из exercises.js
const existingVideos = new Set();
const videoRegex = /videos\/([^\"']+\.mp4)/g;
let match;
while ((match = videoRegex.exec(exercisesContent)) !== null) {
  existingVideos.add(match[1]);
}

// Находим новые видео
const newVideos = allVideos.filter(video => !existingVideos.has(video));

console.log(`📹 Найдено ${newVideos.length} новых видео для добавления\n`);

if (newVideos.length === 0) {
  console.log('✅ Все видео уже добавлены в базу!');
  process.exit(0);
}

// Находим последний ID в exercises.js
const idRegex = /id:\s*"(\d+)"/g;
let lastId = 0;
while ((match = idRegex.exec(exercisesContent)) !== null) {
  const id = parseInt(match[1]);
  if (id > lastId) lastId = id;
}

console.log(`📝 Последний ID в базе: ${lastId}`);
console.log(`🚀 Начинаем добавление...\n`);

// Генерируем новые записи упражнений
const newExercises = [];
let currentId = lastId + 1;

for (const video of newVideos) {
  const videoName = video.replace('.mp4', '');
  const posterName = video.replace('.mp4', '.jpg');
  
  const exercise = {
    id: String(currentId),
    title: `Exercise ${videoName}`,
    video: `\${ASSETS_BASE_URL}/videos/${video}`,
    poster: `\${ASSETS_BASE_URL}/posters/${posterName}`,
    muscleGroups: []
  };
  
  newExercises.push(exercise);
  currentId++;
}

// Формируем строку для вставки
const exercisesToAdd = newExercises.map(ex => {
  return `    {
        id: "${ex.id}",
        title: "${ex.title}",
        video: \`${ex.video}\`,
        poster: \`${ex.poster}\`,
        muscleGroups: []
    }`;
}).join(',\n');

// Находим место для вставки (перед закрывающей скобкой массива)
const insertPosition = exercisesContent.lastIndexOf(']');
const beforeClosing = exercisesContent.substring(0, insertPosition);
const afterClosing = exercisesContent.substring(insertPosition);

// Вставляем новые упражнения
let newContent;
if (beforeClosing.trim().endsWith('}')) {
  // Если последний элемент есть, добавляем запятую
  newContent = beforeClosing + ',\n' + exercisesToAdd + '\n' + afterClosing;
} else {
  // Если массив пустой или последний элемент уже с запятой
  newContent = beforeClosing + exercisesToAdd + '\n' + afterClosing;
}

// Записываем обновленный файл
fs.writeFileSync(exercisesFile, newContent, 'utf8');

console.log(`✅ Добавлено ${newExercises.length} новых упражнений в базу!`);
console.log(`📊 Теперь в базе: ${lastId + newExercises.length} упражнений`);
console.log(`\n💡 Следующий шаг: добавить названия и группы мышц для новых упражнений`);

