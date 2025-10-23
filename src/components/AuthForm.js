"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackRegistration, trackLogin } from "@/lib/analytics";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // переключение между входом и регистрацией
  const { language } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        trackRegistration('email');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        trackLogin('email');
      }
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      // Ошибки обрабатываются автоматически через Firebase
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <form 
        onSubmit={handleSubmit} 
        className="p-8 w-full max-w-sm mx-4"
        autoComplete="off"
      >
        {/* Minimal header */}
        <div className="text-center mb-5">
          <div className="w-10 h-10 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-3">
            <div className="w-3 h-3 rounded-full bg-white/70" />
          </div>
          <h2 className="text-white text-xl font-semibold">
            {isSignUp ? TEXTS[language].auth.signUp : TEXTS[language].auth.signIn}
          </h2>
          <p className="text-white/40 text-xs mt-1">
            {language === 'en' ? 'Unlock your personal workout space' : 'Откройте свой личный фитнес‑пространство'}
          </p>
        </div>
        <input
          type="email"
          placeholder={TEXTS[language].auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="off"
          className="w-full p-2 mb-3 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
        />
        <input
          type="password"
          placeholder={TEXTS[language].auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full p-2 mb-4 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
        />
        <button
          type="submit"
          className="w-full p-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-all duration-300"
        >
          {isSignUp ? TEXTS[language].auth.signUp : TEXTS[language].auth.signIn}
        </button>
        <p className="text-white/60 text-sm mt-4 text-center">
          {isSignUp ? TEXTS[language].auth.alreadyHaveAccount : TEXTS[language].auth.dontHaveAccount}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white hover:text-white/80 underline transition-colors duration-300"
          >
            {isSignUp ? TEXTS[language].auth.signInHere : TEXTS[language].auth.signUpHere}
          </button>
        </p>
      </form>
    </div>
  );
}
