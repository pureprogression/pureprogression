import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { trackRegistration, trackLogin } from "@/lib/analytics";

/** Синхронизирует Firestore users/{uid} после входа через Google */
export async function syncGoogleUserDocument(user, { isNewUser = false } = {}) {
  const userDocRef = doc(db, "users", user.uid);
  let userDoc = await getDoc(userDocRef);

  let existingUserData = null;
  const oldDocsToDelete = [];

  if (user.email) {
    const usersRef = collection(db, "users");
    const emailQuery = query(usersRef, where("email", "==", user.email));
    const emailQuerySnapshot = await getDocs(emailQuery);

    for (const docSnapshot of emailQuerySnapshot.docs) {
      if (docSnapshot.id !== user.uid) {
        oldDocsToDelete.push(docSnapshot);
        if (!existingUserData) {
          existingUserData = docSnapshot.data();
        }
      }
    }
  }

  if (!userDoc.exists()) {
    const newUserData = {
      email: user.email?.toLowerCase() || null,
      displayName: user.displayName || existingUserData?.displayName || null,
      createdAt: existingUserData?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (existingUserData?.subscription) {
      newUserData.subscription = existingUserData.subscription;
    }

    await setDoc(userDocRef, newUserData);

    for (const oldDoc of oldDocsToDelete) {
      await deleteDoc(oldDoc.ref);
    }

    trackRegistration("google");
    return;
  }

  const existingData = userDoc.data();
  const updates = {};
  if (user.email && existingData.email !== user.email.toLowerCase()) {
    updates.email = user.email.toLowerCase();
  }
  if (user.displayName && existingData.displayName !== user.displayName) {
    updates.displayName = user.displayName;
  }
  if (!existingData.subscription && existingUserData?.subscription) {
    updates.subscription = existingUserData.subscription;
  }

  if (Object.keys(updates).length > 0) {
    updates.updatedAt = new Date();
    await updateDoc(userDocRef, updates);
  }

  for (const oldDoc of oldDocsToDelete) {
    await deleteDoc(oldDoc.ref);
  }

  if (isNewUser) {
    trackRegistration("google");
  } else {
    trackLogin("google");
  }
}
