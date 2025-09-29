"use client";

import { useState } from "react";

export default function ProfileTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "favorites", label: "Избранное", icon: "⭐" },
    { id: "workouts", label: "Мои тренировки", icon: "💪" },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="flex gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
