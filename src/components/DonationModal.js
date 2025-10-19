"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { createPayment, CURRENCY_CONFIG } from "@/lib/payments";

export default function DonationModal({ isOpen, onClose }) {
  const { language } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState('RUB');
  const [bitcoinInfo, setBitcoinInfo] = useState(null);
  const [donorName, setDonorName] = useState("");

  const currencies = {
    RUB: { symbol: '₽', amounts: [500, 1000, 2000, 5000, 10000], label: 'Рубль' },
    USD: { symbol: '$', amounts: [25, 50, 100, 250, 500], label: 'Bitcoin', crypto: true }
  };

  const currentCurrency = currencies[currency];
  const predefinedAmounts = currentCurrency.amounts;

  const handleDonate = async () => {
    const amount = selectedAmount || customAmount;
    if (!amount || amount < 1) return;

    setIsProcessing(true);
    let payment = null;
    
    try {
      if (currentCurrency.crypto) {
        // Для криптоплатежей - сразу показываем Bitcoin адрес (без API)
        setBitcoinInfo({
          address: "18g8QKGkqprjSvVF6FdBaiWfdi8W3bbVNb", // Ваш реальный Bitcoin адрес
          amount: amount,
          currency: currency,
          symbol: currentCurrency.symbol
        });
      } else {
        // Для обычных платежей - используем API
        const description = language === 'en' 
          ? `Support Pure Progression - ${amount}${currentCurrency.symbol}`
          : `Поддержка Pure Progression - ${amount}${currentCurrency.symbol}`;

        payment = await createPayment(amount, currency, description);
        
        if (payment.success) {
          // Для обычных платежей - редирект
          alert(
            language === 'en' 
              ? `Thank you for your support of ${amount}${currentCurrency.symbol}! Payment processing...` 
              : `Спасибо за поддержку ${amount}${currentCurrency.symbol}! Обработка платежа...`
          );
          
          if (payment.redirectUrl && payment.redirectUrl !== '#') {
            if (window.location.hostname === 'localhost') {
              window.open(payment.redirectUrl, '_blank');
            } else {
              window.location.href = payment.redirectUrl;
            }
          }
        } else {
          throw new Error(payment.message);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(
        language === 'en' 
          ? `Payment error: ${error.message}` 
          : `Ошибка платежа: ${error.message}`
      );
    } finally {
      setIsProcessing(false);
      // Не закрываем модалку для криптоплатежей - показываем Bitcoin адрес
      if (!currentCurrency.crypto) {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-white/30 rounded-2xl max-w-md w-full p-8 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">💚</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-3">
              {language === 'en' ? 'Make a Difference' : 'Внесите вклад'}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              {language === 'en' 
                ? 'Your support helps us create amazing fitness experiences' 
                : 'Ваша поддержка помогает создавать потрясающие фитнес-тренировки'}
            </p>
          </div>

          {/* Переключатель валют */}
          <div className="mb-6">
            <div className="flex bg-white/10 rounded-xl p-1">
              {Object.keys(currencies).map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    setCurrency(curr);
                    setSelectedAmount(null);
                    setCustomAmount("");
                  }}
                  className={`flex-1 p-3 rounded-lg transition-all duration-300 font-medium ${
                    currency === curr
                      ? "bg-green-400 text-black shadow-lg"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {currencies[curr].label}
                </button>
              ))}
            </div>
            
            {/* Предупреждение для криптовалют */}
            {currentCurrency.crypto && (
              <div className="mt-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <p className="text-orange-300 text-sm text-center">
                  {language === 'en' 
                    ? '⚠️ USD/EUR payments are processed via Bitcoin cryptocurrency' 
                    : '⚠️ Платежи в USD/EUR обрабатываются через Bitcoin'}
                </p>
              </div>
            )}
            
          </div>

          {/* Суммы */}
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 font-semibold ${
                    selectedAmount === amount
                      ? "border-green-400 bg-green-400/20 text-green-400 shadow-lg shadow-green-400/20"
                      : "border-white/30 text-white hover:border-green-400/50 hover:bg-green-400/10 hover:scale-105"
                  }`}
                >
                  {amount}{currentCurrency.symbol}
                </button>
              ))}
            </div>
            
            {/* Кастомная сумма */}
            <div>
              <input
                type="number"
                placeholder={`${language === 'en' ? 'Custom amount' : 'Другая сумма'} (${currentCurrency.symbol})`}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full p-4 bg-white/5 border-2 border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-green-400 focus:bg-white/10 transition-all duration-300 text-center font-semibold"
                min="1"
              />
              
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 p-4 border-2 border-white/30 rounded-xl text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 font-medium"
            >
              {language === 'en' ? 'Cancel' : 'Отмена'}
            </button>
            <button
              onClick={handleDonate}
              disabled={!selectedAmount && !customAmount || isProcessing}
              className="flex-1 p-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl font-bold hover:from-green-300 hover:to-emerald-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {isProcessing 
                ? (language === 'en' ? 'Processing...' : 'Обработка...')
                : (language === 'en' ? 'Support Now' : 'Поддержать сейчас')
              }
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Bitcoin Payment Modal */}
      {bitcoinInfo && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setBitcoinInfo(null)}
        >
          <motion.div
            className="bg-gradient-to-br from-orange-900/95 to-yellow-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">₿</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">
                {language === 'en' ? 'Bitcoin Payment' : 'Bitcoin платеж'}
              </h3>
              
              <p className="text-white/80 mb-4">
                {language === 'en' 
                  ? `Send any amount to this Bitcoin address:`
                  : `Отправьте любую сумму на этот Bitcoin адрес:`}
              </p>
              
              <p className="text-orange-300/80 text-sm mb-4">
                {language === 'en' 
                  ? `💡 We'll remember your message when we receive the payment`
                  : `💡 Мы запомним ваше сообщение, когда получим платеж`}
              </p>
              
              {/* Поле для комментария */}
              <div className="mb-4">
                <textarea
                  placeholder={language === 'en' ? 'Write anything: your name, message, or just say thanks! (optional)' : 'Напишите что угодно: ваше имя, сообщение или просто спасибо! (необязательно)'}
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-white/5 border-2 border-orange-500/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-orange-400 focus:bg-white/10 transition-all duration-300 resize-none"
                />
              </div>
              
              <div className="bg-black/30 border border-orange-500/30 rounded-lg p-4 mb-6">
                <p className="text-orange-300 font-mono text-sm break-all">
                  {bitcoinInfo.address}
                </p>
              </div>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bitcoinInfo.address);
                  alert(language === 'en' ? 'Address copied!' : 'Адрес скопирован!');
                }}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-xl font-bold hover:from-orange-400 hover:to-yellow-400 transition-all duration-300 mb-4"
              >
                {language === 'en' ? 'Copy Address' : 'Копировать адрес'}
              </button>
              
              <button
                onClick={() => setBitcoinInfo(null)}
                className="w-full border border-white/30 text-white py-3 rounded-xl hover:bg-white/10 transition-all duration-300"
              >
                {language === 'en' ? 'Close' : 'Закрыть'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
