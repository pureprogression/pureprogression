"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function AuthObserver({ children }) {
  const [user, setUser] = useState(undefined); // undefined = пока не проверили
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        router.push("/"); // редирект на главную после входа
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (user === undefined) return null; // Убираем загрузочный экран

  return children;
}
