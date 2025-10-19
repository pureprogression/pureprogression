"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
  const router = useRouter();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    
    if (paymentId) {
      // Проверяем статус платежа
      checkPaymentStatus(paymentId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkPaymentStatus = async (paymentId) => {
    try {
      const response = await fetch(`/api/payments/status?paymentId=${paymentId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPaymentInfo(data);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Проверка платежа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/20 rounded-2xl max-w-md w-full p-8 text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Иконка успеха */}
        <motion.div
          className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <span className="text-3xl">✓</span>
        </motion.div>

        {/* Заголовок */}
        <motion.h1
          className="text-2xl font-bold text-white mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Спасибо за поддержку!
        </motion.h1>

        {/* Информация о платеже */}
        {paymentInfo && (
          <motion.div
            className="bg-white/10 rounded-xl p-4 mb-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-white/80 text-sm mb-2">Сумма платежа:</p>
            <p className="text-2xl font-bold text-green-400">
              {paymentInfo.amount} {paymentInfo.currency}
            </p>
            <p className="text-white/60 text-sm mt-2">
              Статус: {paymentInfo.status === 'succeeded' ? 'Оплачено' : 'В обработке'}
            </p>
          </motion.div>
        )}

        {/* Описание */}
        <motion.p
          className="text-white/80 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Ваша поддержка помогает нам развивать лучшую фитнес-платформу!
        </motion.p>

        {/* Кнопки */}
        <motion.div
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={() => router.push('/')}
            className="w-full p-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-bold hover:from-green-300 hover:to-emerald-400 transition-all duration-300"
          >
            Вернуться на главную
          </button>
          
          <button
            onClick={() => router.push('/favorites')}
            className="w-full p-4 border-2 border-white/30 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
          >
            Перейти к тренировкам
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
