"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import Navigation from "@/components/Navigation";
import { TEXTS } from "@/constants/texts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { getBuyerEmail } from "@/lib/buyerEmail";

function formatProfileDate(date, language) {
  if (!date) return "";
  let dateObj = date;
  if (date.toDate) dateObj = date.toDate();
  else if (date.seconds) dateObj = new Date(date.seconds * 1000);
  else if (typeof date === "string") dateObj = new Date(date);
  if (Number.isNaN(dateObj?.getTime?.())) return "";
  return dateObj.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: subscriptionUser, hasSubscription, subscription } = useSubscription();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const { language } = useLanguage();
  const profileTexts = TEXTS[language].profile;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);

      if (u) {
        await loadUserData(u.uid);
      } else {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (subscriptionUser) {
      setUser(subscriptionUser);
    }
  }, [subscriptionUser]);

  const loadUserData = async (userId) => {
    try {
      setIsLoading(true);
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setDisplayName(data.displayName || "");
      }
    } catch (error) {
      console.error("Ошибка при загрузке данных пользователя:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;

    setIsSavingName(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
      });

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        updatedAt: new Date(),
      });

      setUserData({ ...userData, displayName: displayName.trim() });
      setUser({ ...user, displayName: displayName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Ошибка при сохранении имени:", error);
      alert(language === "ru" ? "Ошибка при сохранении имени" : "Error saving name");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;

    const buyerEmail = getBuyerEmail(user);
    if (!buyerEmail) {
      alert(profileTexts.cancelError);
      return;
    }

    if (!window.confirm(profileTexts.cancelConfirm)) return;

    setIsCancelling(true);
    setCancelMessage("");

    try {
      const response = await fetch("/api/payments/lava/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: buyerEmail,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || profileTexts.cancelError);
      }

      const accessDate = formatProfileDate(
        data.accessUntil || subscription?.expiresAt,
        language
      );
      setCancelMessage(
        profileTexts.cancelSuccess.replace("{date}", accessDate)
      );
      await loadUserData(user.uid);
    } catch (error) {
      console.error("Cancel subscription error:", error);
      alert(error.message || profileTexts.cancelError);
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancellationScheduled = Boolean(subscription?.cancelledAt);
  const accessUntilLabel = formatProfileDate(
    subscription?.expiresAt || subscription?.endDate,
    language
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-white/60">{TEXTS[language].common.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <p className="text-white/60 text-center px-4">
          {language === "ru" ? "Войдите в аккаунт" : "Please sign in to your account"}
        </p>
      </div>
    );
  }

  return (
    <>
      <Navigation currentPage="profile" user={user} />
      <div className="min-h-screen bg-app pt-20 pb-12">
        <div className="max-w-lg mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6 text-white">{profileTexts.title}</h1>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 shrink-0 bg-white/15 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {(userData?.displayName || user.displayName || user.email)
                      ?.charAt(0)
                      .toUpperCase() || "U"}
                  </span>
                </div>
                <div className="min-w-0">
                  {isEditingName ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={language === "ru" ? "Ваше имя" : "Your name"}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-brand-500/50 w-full max-w-[180px]"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={isSavingName || !displayName.trim()}
                        className="px-3 py-1.5 bg-brand-500 text-black text-xs font-semibold rounded-lg hover:bg-brand-400 disabled:opacity-50"
                      >
                        {isSavingName
                          ? language === "ru"
                            ? "..."
                            : "..."
                          : TEXTS[language].common.save}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingName(false);
                          setDisplayName(userData?.displayName || user.displayName || "");
                        }}
                        className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20"
                      >
                        {TEXTS[language].common.cancel}
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-white text-lg font-semibold truncate">
                        {userData?.displayName || user.displayName || profileTexts.user}
                      </h2>
                      <p className="text-white/45 text-sm truncate">{user.email}</p>
                    </>
                  )}
                </div>
              </div>
              {!isEditingName && (
                <button
                  onClick={() => {
                    setIsEditingName(true);
                    setDisplayName(userData?.displayName || user.displayName || "");
                  }}
                  className="shrink-0 px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20"
                >
                  {language === "ru" ? "Изменить" : "Edit"}
                </button>
              )}
            </div>
          </div>

          {hasSubscription ? (
            <div className="rounded-2xl border border-brand-500/35 bg-brand-500/10 p-5 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-brand-400" />
                <p className="text-brand-400 font-semibold text-sm">{profileTexts.subscriptionActive}</p>
              </div>
              {isCancellationScheduled && accessUntilLabel && (
                <p className="text-white/55 text-sm mb-3">
                  {profileTexts.cancelledNotice.replace("{date}", accessUntilLabel)}
                </p>
              )}
              {cancelMessage && (
                <p className="text-brand-300/90 text-sm mb-3">{cancelMessage}</p>
              )}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/subscription")}
                  className="text-left text-white/60 text-sm hover:text-white underline-offset-2 hover:underline"
                >
                  {profileTexts.manageSubscription}
                </button>
                {!isCancellationScheduled && (
                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="w-full py-3 rounded-xl border border-white/15 text-white/80 text-sm font-medium hover:bg-white/5 disabled:opacity-50 transition-colors"
                  >
                    {isCancelling ? TEXTS[language].common.loading : profileTexts.cancelSubscription}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 mb-4">
              <p className="text-white font-medium text-sm mb-1">{profileTexts.subscriptionInactive}</p>
              <p className="text-white/45 text-sm mb-4">{profileTexts.subscriptionInactiveHint}</p>
              <button
                type="button"
                onClick={() => router.push("/subscribe")}
                className="w-full py-3 rounded-xl bg-brand-500 text-black font-bold hover:bg-brand-400 transition-colors"
              >
                {profileTexts.getFullAccess}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
