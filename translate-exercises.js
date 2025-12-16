/**
 * Скрипт для добавления английских переводов названий упражнений
 * Запуск: node translate-exercises.js
 */

const fs = require('fs');
const path = require('path');

// Простой словарь для перевода (можно расширить)
const translations = {
  "Выход в вертикальный вис": "Vertical Hang Exit",
  "Стойка на руках с опорой": "Supported Handstand",
  "Отжимания с наклоном": "Incline Push-ups",
  "Отжимания концентрированно": "Concentrated Push-ups",
  "Подтягивания в уголке": "L-sit Pull-ups",
  "Динамичный передний вис": "Dynamic Front Hang",
  "Подтягивания до груди": "Chest Pull-ups",
  "Отжимания от брусьев с поджатыми ногами": "Dips with Bent Legs",
  "Отжимания от брусьев в прямой линии": "Straight Line Dips",
  "Выход вертикально с резиной": "Vertical Exit with Resistance Band"
  // Добавьте остальные переводы по мере необходимости
};

// Читаем файл exercises.js
const exercisesPath = path.join(__dirname, 'src/data/exercises.js');
let content = fs.readFileSync(exercisesPath, 'utf8');

// Простая функция для перевода (можно использовать API перевода)
function translateTitle(title) {
  // Если есть готовый перевод - используем его
  if (translations[title]) {
    return translations[title];
  }
  
  // Иначе возвращаем null (будет использоваться русское название)
  return null;
}

// Заменяем все title: "..." на title: "...", titleEn: "..."
// Это упрощенная версия - для полной реализации нужен парсер
console.log('Для полного перевода всех упражнений нужно:');
console.log('1. Добавить переводы в словарь translations');
console.log('2. Или использовать API перевода (Google Translate, Yandex Translate и т.д.)');
console.log('3. Или вручную добавить поле titleEn для каждого упражнения');

// Пример: как добавить titleEn вручную
// {
//   id: "4",
//   title: "Выход в вертикальный вис",
//   titleEn: "Vertical Hang Exit",  // <-- добавить это поле
//   video: ...
// }

