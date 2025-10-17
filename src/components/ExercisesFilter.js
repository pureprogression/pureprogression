"use client";

import { useState } from "react";

export default function ExercisesFilter({ selectedGroup, setSelectedGroup, exercises }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Получаем все уникальные группы мышц (без "All")
  const muscleGroups = Array.from(new Set(exercises.flatMap(ex => ex.muscleGroups)));

  return (
    <div className="p-4">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide max-w-[calc(100vw-32px)]">
        {/* Кнопка "All" - основной триггер */}
        <button
          onClick={() => {
            if (isExpanded) {
              // Если закрываем фильтр, выбираем "All"
              setSelectedGroup("All");
            }
            setIsExpanded(!isExpanded);
          }}
          className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 text-sm flex-shrink-0 ${
            isExpanded 
              ? "bg-white text-black" 
              : "bg-transparent text-white border border-white/30 hover:border-white/60"
          }`}
        >
          All
        </button>

        {/* Раскрывающиеся фильтры в той же строке */}
        {isExpanded && muscleGroups.map((group, index) => (
          <button
            key={group}
            onClick={() => {
              if (selectedGroup === group) {
                // Если кликаем на уже выбранный фильтр, возвращаемся к "All"
                setSelectedGroup("All");
              } else {
                // Иначе выбираем новый фильтр
                setSelectedGroup(group);
              }
            }}
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
