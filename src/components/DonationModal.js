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

  const currencies = {
    RUB: { symbol: '', amounts: [500, 1000, 2000, 5000, 10000], label: 'Рубль' },
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
        className="fixed inset-0 bg-transparent backdrop-blur-2xl z-[10000] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white/10 border border-white/20 rounded-2xl max-w-md w-full p-6 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-2xl">✨</span>
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
          <div className="mb-5">
            <div className="flex bg-white/10 rounded-xl p-1 border border-white/10">
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
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  {currencies[curr].label}
                </button>
              ))}
            </div>
            
            {/* Предупреждение для криптовалют */}
            {currentCurrency.crypto && (
              <div className="mt-3 p-3 bg-white/10 border border-white/10 rounded-lg">
                <p className="text-white/80 text-sm text-center">
                  {language === 'en' 
                    ? '⚠️ USD/EUR payments are processed via Bitcoin cryptocurrency' 
                    : '⚠️ Платежи в USD/EUR обрабатываются через Bitcoin'}
                </p>
              </div>
            )}
            
          </div>

          {/* Суммы */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {predefinedAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  className={`p-3 rounded-lg border transition-all duration-300 font-medium text-sm ${
                    selectedAmount === amount
                      ? "border-white/30 bg-white/20 text-white"
                      : "border-white/10 text-white/80 hover:border-white/20 hover:bg-white/10 hover:scale-105"
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
                className="w-full p-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300 text-center font-medium text-sm"
                min="1"
              />
              
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 p-3 border border-white/10 rounded-lg text-white/80 hover:bg-white/10 hover:border-white/20 transition-all duration-300 font-medium text-sm"
            >
              {language === 'en' ? 'Cancel' : 'Отмена'}
            </button>
            <button
              onClick={handleDonate}
              disabled={!selectedAmount && !customAmount || isProcessing}
              className="flex-1 p-3 bg-white/15 text-white rounded-lg font-medium hover:bg-white/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none text-sm"
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
          className="fixed inset-0 bg-transparent backdrop-blur-2xl z-[10001] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setBitcoinInfo(null)}
        >
          <motion.div
            className="bg-white/10 border border-white/20 rounded-2xl max-w-md w-full p-8 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl text-white">₿</span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">
                {language === 'en' ? 'Bitcoin Payment' : 'Bitcoin платеж'}
              </h3>
              
              <p className="text-white/80 mb-4">
                {language === 'en' 
                  ? `Send any amount to this Bitcoin address:`
                  : `Отправьте любую сумму на этот Bitcoin адрес:`}
              </p>
              
              
              <div className="bg-white/10 border border-white/10 rounded-lg p-4 mb-6">
                <p className="text-white font-mono text-sm break-all">
                  {bitcoinInfo.address}
                </p>
              </div>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(bitcoinInfo.address);
                  alert(language === 'en' ? 'Address copied!' : 'Адрес скопирован!');
                }}
                className="w-full bg-white/15 text-white py-3 rounded-xl font-bold hover:bg-white/25 transition-all duration-300 mb-4"
              >
                {language === 'en' ? 'Copy Address' : 'Копировать адрес'}
              </button>
              
              <button
                onClick={() => setBitcoinInfo(null)}
                className="w-full border border-white/10 text-white/80 py-3 rounded-xl hover:bg-white/10 transition-all duration-300"
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
