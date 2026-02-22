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
    "chest": "Грудь",
    "complex": "COMPLEX"
  },
  en: {
    "back": "Back",
    "arms": "Arms",
    "abs": "Abs",
    "core": "Core",
    "legs": "Legs",
    "glutes": "Glutes",
    "shoulders": "Shoulders",
    "chest": "Chest",
    "complex": "COMPLEX"
  }
};

export default function ExercisesFilter({ selectedGroup, setSelectedGroup, onGroupChange, exercises, isExpanded: externalIsExpanded, setIsExpanded: externalSetIsExpanded }) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const { language } = useLanguage();
  
  // Используем внешнее состояние, если оно передано, иначе внутреннее
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = externalSetIsExpanded || setInternalIsExpanded;
  
  // Получаем все уникальные группы мышц (без "All")
  const uniqueGroups = Array.from(new Set(exercises.flatMap(ex => ex.muscleGroups)));
  const hasComplex = uniqueGroups.includes("complex");
  const muscleGroups = hasComplex
    ? ["complex", ...uniqueGroups.filter((g) => g !== "complex")]
    : uniqueGroups;
  
  // Функция для получения переведенного названия группы
  const getTranslatedGroup = (group) => {
    return muscleGroupTranslations[language]?.[group] || group;
  };
  
  // Используем правильную функцию для изменения группы
  const handleGroupChange = onGroupChange || setSelectedGroup;

  return (
    <div className="pl-2 pr-4 h-8">
      <div 
        className="flex gap-1.5 overflow-x-auto scrollbar-hide h-full items-center min-h-[28px]"
        style={{ maxWidth: 'calc(100vw - 32px)' }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Иконка круга - индикатор */}
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`relative w-7 h-7 flex items-center justify-center cursor-pointer transition-all duration-300 flex-shrink-0 ${
            isExpanded 
              ? "text-white" 
              : "text-white/70 hover:text-white"
          }`}
          title="Фильтр по группам мышц"
        >
          {isExpanded ? (
            <div className="w-3.5 h-3.5 rounded-full bg-white transition-all duration-300"></div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-current transition-all duration-300"></div>
          )}
        </button>

        {/* Фильтры с условным отображением */}
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
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-200 text-xs flex-shrink-0 animate-fade-in ${
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
