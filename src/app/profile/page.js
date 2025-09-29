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
      <div className="max-w-[1200px] mx-auto p-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Профиль</h2>
          
          {/* Информация о пользователе */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-white text-xl font-semibold">
                  {user.displayName || 'Пользователь'}
                </h3>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-400">
              Дата регистрации: {user.metadata?.creationTime ? 
                new Date(user.metadata.creationTime).toLocaleDateString('ru-RU') : 
                'Неизвестно'
              }
            </div>
          </div>

          {/* Текущий план */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h3 className="text-white text-lg font-semibold mb-4">Текущий план</h3>
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white font-medium">Бесплатный план</div>
                  <div className="text-gray-400 text-sm">Ограниченные возможности</div>
                </div>
                <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 px-4 rounded-lg font-medium hover:from-yellow-400 hover:to-orange-400 transition-all duration-300">
                  Апгрейд
                </button>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <h3 className="text-white text-lg font-semibold mb-4">Статистика</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-white text-2xl font-bold">0</div>
                <div className="text-gray-400 text-sm">Тренировок</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-white text-2xl font-bold">0</div>
                <div className="text-gray-400 text-sm">Упражнений</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-white text-2xl font-bold">0</div>
                <div className="text-gray-400 text-sm">Часов</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-white text-2xl font-bold">0</div>
                <div className="text-gray-400 text-sm">Ккал</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}