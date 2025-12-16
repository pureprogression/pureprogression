"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackRegistration, trackLogin } from "@/lib/analytics";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: undefined // убираем ограничение на домен
});

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oobCode, setOobCode] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null); // 'success' | 'error' | null
  const { language } = useLanguage();

  // Проверяем параметры URL для сброса пароля и верификации email
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const code = urlParams.get('oobCode');
      
      if (mode === 'resetPassword' && code) {
        setResetMode(true);
        setOobCode(code);
      } else if (mode === 'verifyEmail' && code) {
        setVerifyMode(true);
        setOobCode(code);
        handleEmailVerification(code);
      }
    }
  }, []);

  const handleEmailVerification = async (code) => {
    setIsLoading(true);
    try {
      await applyActionCode(auth, code);
      setVerificationStatus('success');
    } catch (error) {
      console.error('Email verification error:', error);
      setVerificationStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Обновляем displayName в Firebase Auth, если указано
        if (displayName.trim()) {
          await updateProfile(user, {
            displayName: displayName.trim()
          });
        }
        
        // Создаем документ пользователя в коллекции users
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        // Создаем документ только если его еще нет
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            displayName: displayName.trim() || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Отправляем письмо для подтверждения email
        try {
          await sendEmailVerification(user, {
            url: `${window.location.origin}/auth`,
            handleCodeInApp: false
          });
        } catch (e) {
          console.error("Failed to send verification email", e);
        }
        
        setDisplayName("");
        trackRegistration('email');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Создаем документ пользователя в коллекции users, если его еще нет
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            displayName: user.displayName || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
        trackLogin('email');
      }
      setEmail("");
      setPassword("");
      setAuthError(null);
    } catch (error) {
      console.error(error);
      // Обрабатываем ошибки Firebase и показываем понятные сообщения
      let errorMessage = '';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          errorMessage = language === 'en' 
            ? 'Invalid email or password. If you registered with Google, please use "Continue with Google" button'
            : 'Неверный email или пароль. Если вы регистрировались через Google, используйте кнопку "Войти через Google"';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = language === 'en'
            ? 'This account was created with Google. Please use "Continue with Google" button'
            : 'Этот аккаунт был создан через Google. Используйте кнопку "Войти через Google"';
          break;
        case 'auth/email-already-in-use':
          errorMessage = language === 'en'
            ? 'This email is already registered'
            : 'Этот email уже зарегистрирован';
          break;
        case 'auth/weak-password':
          errorMessage = language === 'en'
            ? 'Password should be at least 6 characters'
            : 'Пароль должен содержать минимум 6 символов';
          break;
        case 'auth/invalid-email':
          errorMessage = language === 'en'
            ? 'Invalid email address'
            : 'Неверный адрес email';
          break;
        case 'auth/too-many-requests':
          errorMessage = language === 'en'
            ? 'Too many attempts. Please try again later'
            : 'Слишком много попыток. Попробуйте позже';
          break;
        default:
          errorMessage = language === 'en'
            ? 'An error occurred. Please try again'
            : 'Произошла ошибка. Попробуйте еще раз';
      }
      
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Создаем документ пользователя в коллекции users, если его еще нет
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || null,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        trackRegistration('google');
      } else {
        trackLogin('google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setResetError(null);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/auth`,
        handleCodeInApp: false
      });
      setResetEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      let errorMessage = language === 'en' 
        ? 'Failed to send reset email. Please try again.'
        : 'Не удалось отправить письмо. Попробуйте еще раз.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = language === 'en'
          ? 'No account found with this email address.'
          : 'Аккаунт с таким email не найден.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = language === 'en'
          ? 'Invalid email address.'
          : 'Неверный email адрес.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = language === 'en'
          ? 'Too many requests. Please try again later.'
          : 'Слишком много запросов. Попробуйте позже.';
      }
      
      setResetError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword !== confirmPassword) {
      setResetError(language === 'en' 
        ? 'Passwords do not match.'
        : 'Пароли не совпадают.');
      return;
    }
    
    if (newPassword.length < 6) {
      setResetError(language === 'en'
        ? 'Password must be at least 6 characters.'
        : 'Пароль должен содержать минимум 6 символов.');
      return;
    }
    
    setIsLoading(true);
    setResetError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetEmailSent(true);
      setResetMode(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      let errorMessage = language === 'en'
        ? 'Failed to reset password. The link may have expired.'
        : 'Не удалось сбросить пароль. Ссылка могла истечь.';
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = language === 'en'
          ? 'The password reset link has expired. Please request a new one.'
          : 'Ссылка для сброса пароля истекла. Запросите новую.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = language === 'en'
          ? 'Invalid reset link. Please request a new one.'
          : 'Неверная ссылка. Запросите новую.';
      }
      
      setResetError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Показываем результат верификации email
  if (verifyMode) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-8 w-full max-w-sm mx-4 text-center">
          {verificationStatus === 'success' ? (
            <>
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">
                {language === 'en' ? 'Email Verified' : 'Email подтвержден'}
              </h2>
              <p className="text-white/60 text-sm mb-6">
                {language === 'en'
                  ? 'Your email has been successfully verified. You can now log in.'
                  : 'Ваш email успешно подтвержден. Теперь вы можете войти.'}
              </p>
              <button
                onClick={() => {
                  setVerifyMode(false);
                  setOobCode(null);
                  setVerificationStatus(null);
                  window.history.replaceState({}, '', '/auth');
                }}
                className="w-full p-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-all duration-300"
              >
                {language === 'en' ? 'Go to Login' : 'Перейти к входу'}
              </button>
            </>
          ) : verificationStatus === 'error' ? (
            <>
              <div className="w-12 h-12 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">
                {language === 'en' ? 'Verification Failed' : 'Ошибка подтверждения'}
              </h2>
              <p className="text-white/60 text-sm mb-6">
                {language === 'en'
                  ? 'The verification link has expired or is invalid. Please request a new verification email.'
                  : 'Ссылка для подтверждения истекла или недействительна. Запросите новое письмо.'}
              </p>
              <button
                onClick={() => {
                  setVerifyMode(false);
                  setOobCode(null);
                  setVerificationStatus(null);
                  window.history.replaceState({}, '', '/auth');
                }}
                className="w-full p-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-all duration-300"
              >
                {language === 'en' ? 'Back to Login' : 'Вернуться к входу'}
              </button>
            </>
          ) : (
            <div className="text-white/60">
              {language === 'en' ? 'Verifying email...' : 'Подтверждение email...'}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Показываем форму сброса пароля, если есть код в URL
  if (resetMode && oobCode) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-8 w-full max-w-sm mx-4">
          {resetEmailSent ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">
                {language === 'en' ? 'Password Reset' : 'Пароль изменен'}
              </h2>
              <p className="text-white/60 text-sm mb-6">
                {language === 'en'
                  ? 'Your password has been successfully reset. You can now log in with your new password.'
                  : 'Пароль успешно изменен. Теперь вы можете войти с новым паролем.'}
              </p>
              <button
                onClick={() => {
                  setResetMode(false);
                  setResetEmailSent(false);
                  setOobCode(null);
                  window.history.replaceState({}, '', '/auth');
                }}
                className="w-full p-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-all duration-300"
              >
                {language === 'en' ? 'Go to Login' : 'Перейти к входу'}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="text-center">
              <h2 className="text-white text-xl font-semibold mb-4">
                {language === 'en' ? 'Reset Password' : 'Сброс пароля'}
              </h2>
              <p className="text-white/60 text-sm mb-4">
                {language === 'en'
                  ? 'Enter your new password'
                  : 'Введите новый пароль'}
              </p>
              <input
                type="password"
                placeholder={language === 'en' ? 'New password' : 'Новый пароль'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setResetError(null);
                }}
                required
                minLength={6}
                autoComplete="new-password"
                data-form-type="other"
                className="w-full p-2 mb-3 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
              />
              <input
                type="password"
                placeholder={language === 'en' ? 'Confirm password' : 'Подтвердите пароль'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setResetError(null);
                }}
                required
                minLength={6}
                autoComplete="new-password"
                data-form-type="other"
                className="w-full p-2 mb-4 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
              />
              {resetError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                  <p className="text-red-400 text-sm">{resetError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full p-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading
                  ? (language === 'en' ? 'Resetting...' : 'Сброс...')
                  : (language === 'en' ? 'Reset Password' : 'Сбросить пароль')}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-8 w-full max-w-sm mx-4">
          {resetEmailSent ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">
                {language === 'en' ? 'Email Sent' : 'Письмо отправлено'}
              </h2>
              <p className="text-white/60 text-sm mb-6">
                {language === 'en' 
                  ? 'Check your email for password reset instructions'
                  : 'Проверьте почту для инструкций по сбросу пароля'}
              </p>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmailSent(false);
                  setResetError(null);
                }}
                className="text-white/60 hover:text-white text-sm underline"
              >
                {language === 'en' ? 'Back to login' : 'Вернуться к входу'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="text-center">
              <h2 className="text-white text-xl font-semibold mb-4">
                {language === 'en' ? 'Reset Password' : 'Сброс пароля'}
              </h2>
              <p className="text-white/60 text-sm mb-4">
                {language === 'en' 
                  ? 'Enter your email and we\'ll send you a link to reset your password'
                  : 'Введите email, и мы отправим ссылку для сброса пароля'}
              </p>
              <input
                type="email"
                placeholder={TEXTS[language].auth.email}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setResetError(null);
                }}
                required
                className="w-full p-2 mb-4 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
              />
              {resetError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
                  <p className="text-red-400 text-sm">{resetError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full p-2 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
              >
                {isLoading 
                  ? (language === 'en' ? 'Sending...' : 'Отправка...')
                  : (language === 'en' ? 'Send Reset Link' : 'Отправить ссылку')
                }
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetError(null);
                }}
                className="text-white/60 hover:text-white text-sm mt-4 underline"
              >
                {language === 'en' ? 'Back to login' : 'Вернуться к входу'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form 
        onSubmit={handleSubmit} 
        className="p-8 w-full max-w-sm mx-4"
        autoComplete="off"
        data-form-type="other"
      >
        {/* Minimal header */}
        <div className="text-center mb-6">
          <h2 className="text-white text-xl font-semibold">
            {isSignUp ? TEXTS[language].auth.signUp : TEXTS[language].auth.signIn}
          </h2>
        </div>

        {isSignUp && (
          <input
            type="text"
            placeholder={language === 'ru' ? 'Ваше имя' : 'Your name'}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            className="w-full p-2 mb-3 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
          />
        )}
        <input
          type="email"
          placeholder={TEXTS[language].auth.email}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setAuthError(null);
          }}
          required
          autoComplete={isSignUp ? "username" : "off"}
          data-form-type="other"
          className="w-full p-2 mb-3 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
        />
        <input
          type="password"
          placeholder={TEXTS[language].auth.password}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setAuthError(null);
          }}
          required
          autoComplete={isSignUp ? "new-password" : "current-password"}
          data-form-type="other"
          className="w-full p-2 mb-3 rounded-md bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all duration-300"
        />
        
        {authError && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-500/30 rounded-md">
            <p className="text-red-400 text-sm">{authError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-2 mb-3 bg-white text-black rounded-md font-medium hover:bg-white/90 transition-all duration-300 disabled:opacity-50"
        >
          {isLoading 
            ? (language === 'en' ? 'Loading...' : 'Загрузка...')
            : (isSignUp ? TEXTS[language].auth.signUp : TEXTS[language].auth.signIn)
          }
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-white/20"></div>
          <span className="text-white/40 text-xs">{language === 'en' ? 'or' : 'или'}</span>
          <div className="flex-1 h-px bg-white/20"></div>
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full p-2 mb-4 bg-white/10 text-white rounded-md font-medium hover:bg-white/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 border border-white/20"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{language === 'en' ? 'Continue with Google' : 'Войти через Google'}</span>
        </button>

        <div className="text-center space-y-2">
          <p className="text-white/60 text-sm">
          {isSignUp ? TEXTS[language].auth.alreadyHaveAccount : TEXTS[language].auth.dontHaveAccount}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white hover:text-white/80 underline transition-colors duration-300"
          >
            {isSignUp ? TEXTS[language].auth.signInHere : TEXTS[language].auth.signUpHere}
          </button>
        </p>
          {!isSignUp && (
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-white/60 hover:text-white text-xs underline"
            >
              {language === 'en' ? 'Forgot password?' : 'Забыли пароль?'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
