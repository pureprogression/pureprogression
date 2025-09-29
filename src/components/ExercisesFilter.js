"use client";

export default function ExercisesFilter({ selectedGroup, setSelectedGroup, exercises }) {
  // Получаем все уникальные группы мышц
  const muscleGroups = ["All", ...Array.from(new Set(exercises.flatMap(ex => ex.muscleGroups)))];

  return (
    <div className="flex gap-3 p-4 overflow-x-auto">
      {muscleGroups.map((group) => (
        <button
          key={group}
          onClick={() => setSelectedGroup(group)}
          className={`px-4  rounded-full whitespace-nowrap ${
            selectedGroup === group ? "bg-white text-black" : " text-white"
          }`}
        >
          {group}
        </button>
      ))}
    </div>
  );
}
