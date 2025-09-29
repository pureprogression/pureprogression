"use client";

export default function ViewToggle({ viewMode, onToggle, className = "" }) {
  return (
    <button
      className={`group p-2 rounded-lg transition-all duration-200 ease-out hover:opacity-80 focus:outline-none ${className}`}
      onClick={onToggle}
      aria-label={viewMode === "slider" ? "Показать сеткой" : "Показать слайдером"}
      title={viewMode === "slider" ? "Сетка" : "Слайдер"}
    >
      {viewMode === "slider" ? (
        // Grid icon - 4 dots in 2x2
        <div className="grid grid-cols-2 gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
        </div>
      ) : (
        // Slider icon - 3 clean lines
        <div className="flex flex-col gap-1">
          <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
          <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
          <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
        </div>
      )}
    </button>
  );
}
