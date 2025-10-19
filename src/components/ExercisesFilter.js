"use client";

import { useState } from "react";

export default function ExercisesFilter({ selectedGroup, setSelectedGroup, onGroupChange, exercises }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Получаем все уникальные группы мышц (без "All")
  const muscleGroups = Array.from(new Set(exercises.flatMap(ex => ex.muscleGroups)));
  
  // Используем правильную функцию для изменения группы
  const handleGroupChange = onGroupChange || setSelectedGroup;

  return (
    <div className="p-4 h-12 overflow-hidden">
      <div 
        className="flex gap-3 overflow-x-auto scrollbar-hide max-w-[calc(100vw-32px)] h-full items-center"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Тонкие стильные линии фильтра - основной триггер */}
        <div
          onClick={() => {
            if (isExpanded) {
              // Если закрываем фильтр, выбираем "All"
              handleGroupChange("All");
            }
            setIsExpanded(!isExpanded);
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className={`flex flex-col gap-0.5 cursor-pointer transition-all duration-300 flex-shrink-0 ${
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
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 text-sm flex-shrink-0 animate-fade-in ${
              selectedGroup === group 
                ? "bg-white text-black" 
                : "bg-transparent text-white"
            }`}
            style={{
              animationDelay: `${index * 0.1}s`,
              animationFillMode: 'both'
            }}
          >
            {group}
          </button>
        ))}
      </div>
    </div>
  );
}
