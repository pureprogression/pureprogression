import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { syncGoogleUserDocument } from "@/lib/syncGoogleUser";

/**
 * Ждёт восстановления сессии Firebase и обработки signInWithRedirect.
 * Нужно, чтобы не редиректить на /auth до проверки логина и не терять Google redirect.
 */
export function useAuthReady() {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [redirectHandled, setRedirectHandled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user && !cancelled) {
          const isNewUser =
            result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
          await syncGoogleUserDocument(result.user, { isNewUser });
        }
      } catch (error) {
        if (!cancelled) {
          console.error("[Auth] Google redirect error:", error);
        }
      } finally {
        if (!cancelled) setRedirectHandled(true);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return { user, isAuthReady, redirectHandled };
}
