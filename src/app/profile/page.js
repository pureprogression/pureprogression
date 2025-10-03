"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import Navigation from "@/components/Navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  if (!user)
    return <p className="text-center mt-10">Пожалуйста, войдите в аккаунт</p>;

  return (
    <>
      <Navigation currentPage="profile" user={user} />
      <div className="pt-16">
        <div className="max-w-[1200px] mx-auto p-4">
          <h2 className="text-2xl font-bold mb-6">Профиль</h2>
          
          {/* Информация о пользователе */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold">
                  {user.displayName || 'Пользователь'}
                </h3>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Текущий план */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white font-medium text-sm">Бесплатный план</div>
                <div className="text-gray-400 text-xs">Ограниченные возможности</div>
              </div>
              <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 px-3 rounded-lg font-medium text-sm hover:from-yellow-400 hover:to-orange-400 transition-all duration-300">
                Апгрейд
              </button>
            </div>
          </div>

          {/* Минимальная статистика */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-white text-sm font-semibold mb-3">Активность</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-white text-lg font-bold">0</div>
                <div className="text-gray-400 text-xs">Тренировок</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-white text-lg font-bold">0</div>
                <div className="text-gray-400 text-xs">Упражнений</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}