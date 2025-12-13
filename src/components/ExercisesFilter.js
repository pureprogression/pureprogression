"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// Переводы групп мышц
const muscleGroupTranslations = {
  ru: {
    "back": "Спина",
    "arms": "Руки",
    "abs": "Пресс",
    "core": "Кор",
    "legs": "Ноги",
    "glutes": "Ягодицы",
    "shoulders": "Плечи",
    "chest": "Грудь"
  },
  en: {
    "back": "Back",
    "arms": "Arms",
    "abs": "Abs",
    "core": "Core",
    "legs": "Legs",
    "glutes": "Glutes",
    "shoulders": "Shoulders",
    "chest": "Chest"
  }
};

export default function ExercisesFilter({ selectedGroup, setSelectedGroup, onGroupChange, exercises, isExpanded: externalIsExpanded, setIsExpanded: externalSetIsExpanded }) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const { language } = useLanguage();
  
  // Используем внешнее состояние, если оно передано, иначе внутреннее
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = externalSetIsExpanded || setInternalIsExpanded;
  
  // Получаем все уникальные группы мышц (без "All")
  const muscleGroups = Array.from(new Set(exercises.flatMap(ex => ex.muscleGroups)));
  
  // Функция для получения переведенного названия группы
  const getTranslatedGroup = (group) => {
    return muscleGroupTranslations[language]?.[group] || group;
  };
  
  // Используем правильную функцию для изменения группы
  const handleGroupChange = onGroupChange || setSelectedGroup;

  return (
    <div className="p-2 h-10 overflow-visible">
      <div 
        className="flex gap-2 overflow-x-auto scrollbar-hide max-w-[calc(100vw-16px)] h-full items-center min-h-[32px]"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Тонкие стильные линии фильтра - основной триггер */}
        <div
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`relative flex flex-col gap-0.5 cursor-pointer transition-all duration-300 flex-shrink-0 ${
            isExpanded 
              ? "text-white" 
              : "text-white"
          }`}
          title="Фильтр по группам мышц"
        >
          <div className={`w-5 h-px transition-all duration-300 ${
            isExpanded ? "bg-white/20" : "bg-white"
          }`}></div>
          <div className={`w-3 h-px transition-all duration-300 ${
            isExpanded ? "bg-white/20" : "bg-white"
          }`}></div>
          <div className={`w-4 h-px transition-all duration-300 ${
            isExpanded ? "bg-white/20" : "bg-white"
          }`}></div>
          
          {/* Индикатор активного фильтра */}
          {!isExpanded && selectedGroup !== "All" && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full ring-2 ring-black ring-offset-0"></div>
          )}
        </div>

        {/* Раскрывающиеся фильтры в той же строке */}
        {isExpanded && muscleGroups.map((group, index) => (
          <button
            key={group}
            onClick={() => {
              if (selectedGroup === group) {
                // Если кликаем на уже выбранный фильтр, возвращаемся к "All"
                handleGroupChange("All");
              } else {
                // Иначе выбираем новый фильтр
                handleGroupChange(group);
              }
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 text-sm flex-shrink-0 animate-fade-in ${
              selectedGroup === group 
                ? "bg-white text-black shadow-[0_2px_8px_rgba(255,255,255,0.2)]" 
                : "bg-transparent text-white border-0 hover:text-white/90"
            }`}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            {getTranslatedGroup(group)}
          </button>
        ))}
      </div>
    </div>
  );
}
