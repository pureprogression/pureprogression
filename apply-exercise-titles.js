/**
 * ЕДИНСТВЕННЫЙ скрипт для применения названий упражнений
 * Читает exercises-to-fill.txt и применяет названия к exercises.js
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, 'src', 'data', 'exercises.js');
const fillFile = path.join(__dirname, 'exercises-to-fill.txt');

// Читаем файл с заполненными данными
const fillContent = fs.readFileSync(fillFile, 'utf8');
const lines = fillContent.split('\n').filter(line => {
  return line.trim() && !line.trim().startsWith('#') && line.includes('|');
});

// Парсим заполненные данные
const videoToTitle = {};
lines.forEach(line => {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length >= 3) {
    const video = parts[1];
    const title = parts[2];
    if (title && title !== 'Pike Push-ups Variation 2' && title !== 'undefined') {
      videoToTitle[video] = title;
    }
  }
});

console.log(`\n📝 Найдено ${Object.keys(videoToTitle).length} названий\n`);

// Читаем исходный файл построчно
let content = fs.readFileSync(exercisesFile, 'utf8');
const lines_array = content.split('\n');

let updatedCount = 0;
let currentVideo = null;
let titleLineIndex = -1;

// Проходим по каждой строке
for (let i = 0; i < lines_array.length; i++) {
  const line = lines_array[i];
  
  // Ищем строку с title (может быть до video)
  if (line.includes('title:') && !line.includes('ASSETS_BASE_URL')) {
    const titleMatch = line.match(/title:\s*"([^"]+)"/);
    if (titleMatch) {
      titleLineIndex = i;
    }
  }
  
  // Ищем строку с video
  if (line.includes('/videos/') && line.includes('.mp4')) {
    const match = line.match(/\/videos\/([^"']+\.mp4)/);
    if (match) {
      currentVideo = match[1];
      
      // Если title уже был найден (до video), обновляем его
      if (titleLineIndex !== -1 && videoToTitle[currentVideo]) {
        const newTitle = videoToTitle[currentVideo];
        const titleLine = lines_array[titleLineIndex];
        const oldTitleMatch = titleLine.match(/title:\s*"([^"]+)"/);
        
        if (oldTitleMatch) {
          const oldTitle = oldTitleMatch[1];
          if (oldTitle !== newTitle) {
            lines_array[titleLineIndex] = titleLine.replace(/title:\s*"[^"]+"/, `title: "${newTitle}"`);
            updatedCount++;
            console.log(`✓ ${currentVideo}: "${oldTitle.substring(0, 35)}..." → "${newTitle}"`);
          }
        }
        titleLineIndex = -1;
        currentVideo = null;
      }
    }
  }
  
  // Если video был найден раньше, ищем title после него
  if (currentVideo && line.includes('title:') && !line.includes('ASSETS_BASE_URL')) {
    if (videoToTitle[currentVideo]) {
      const newTitle = videoToTitle[currentVideo];
      const titleMatch = line.match(/title:\s*"([^"]+)"/);
      
      if (titleMatch) {
        const oldTitle = titleMatch[1];
        if (oldTitle !== newTitle) {
          lines_array[i] = line.replace(/title:\s*"[^"]+"/, `title: "${newTitle}"`);
          updatedCount++;
          console.log(`✓ ${currentVideo}: "${oldTitle.substring(0, 35)}..." → "${newTitle}"`);
        }
      }
    }
    currentVideo = null;
    titleLineIndex = -1;
  }
}

// Сохраняем
const newContent = lines_array.join('\n');
fs.writeFileSync(exercisesFile, newContent, 'utf8');

console.log(`\n✅ Обновлено ${updatedCount} названий упражнений\n`);

