/**
 * Скрипт для генерации списка упражнений с placeholder названиями
 * Выводит список всех упражнений для быстрого заполнения
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');
const exercisesContent = fs.readFileSync(exercisesFile, 'utf8');

// Извлекаем все упражнения с placeholder названиями
const exerciseRegex = /id:\s*"(\d+)"[\s\S]*?title:\s*"Exercise\s+([^"]+)"[\s\S]*?video:.*?\/videos\/([^"']+\.mp4)/g;

const exercises = [];
let match;

while ((match = exerciseRegex.exec(exercisesContent)) !== null) {
  exercises.push({
    id: match[1],
    currentTitle: match[2],
    videoFile: match[3]
  });
}

console.log(`\n📋 Найдено ${exercises.length} упражнений с placeholder названиями\n`);
console.log('='.repeat(80));
console.log('СПИСОК УПРАЖНЕНИЙ ДЛЯ ЗАПОЛНЕНИЯ:');
console.log('='.repeat(80));
console.log('\nФормат: ID | Видео | Текущее название\n');

exercises.forEach((ex, index) => {
  console.log(`${String(index + 1).padStart(3, ' ')}. ID: ${ex.id.padEnd(4)} | ${ex.videoFile.padEnd(15)} | ${ex.currentTitle}`);
});

console.log('\n' + '='.repeat(80));
console.log('\n💡 Инструкция:');
console.log('1. Просмотрите список выше');
console.log('2. Продиктуйте названия для каждого упражнения');
console.log('3. Или используйте типичные названия (Pull-ups, Push-ups, Squats, Dips, Planks, etc.)');
console.log('4. Я добавлю их в базу с группами мышц\n');

