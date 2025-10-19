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
        className="bg-black/95 backdrop-blur-xl border border-white/20 p-8 rounded-lg w-full max-w-sm mx-4"
      >
        <h2 className="text-white text-2xl font-bold mb-6 text-center">
          {isSignUp ? TEXTS[language].auth.signUp : TEXTS[language].auth.signIn}
        </h2>
        <input
          type="email"
          placeholder={TEXTS[language].auth.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 mb-4 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
        />
        <input
          type="password"
          placeholder={TEXTS[language].auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-6 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
        />
        <button
          type="submit"
          className="w-full p-3 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-all duration-300"
        >
          {isSignUp ? TEXTS[language].auth.signUp : TEXTS[language].auth.signIn}
        </button>
        <p className="text-white/80 text-sm mt-4 text-center">
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
