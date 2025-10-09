"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";

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
        alert("Registration successful!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Sign in successful!");
      }
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <form 
        onSubmit={handleSubmit} 
        className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-sm"
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
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder={TEXTS[language].auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 mb-6 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition"
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
        <p className="text-white text-sm mt-4 text-center">
          {isSignUp ? TEXTS[language].auth.alreadyHaveAccount : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 underline"
          >
            {isSignUp ? TEXTS[language].auth.signInHere : TEXTS[language].auth.signUpHere}
          </button>
        </p>
      </form>
    </div>
  );
}
