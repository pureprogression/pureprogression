import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getPlanDurationMonths } from "@/constants/lavaSubscription";

function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
}

export function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function findUserIdByEmail(email) {
  if (!email) return null;
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].id;
}

async function resolveUserId({ userId, email, contractId }) {
  if (userId) return userId;

  if (contractId) {
    const pendingRef = doc(db, "pendingLavaPayments", contractId);
    const pendingDoc = await getDoc(pendingRef);
    if (pendingDoc.exists()) {
      return pendingDoc.data().userId || null;
    }
  }

  return findUserIdByEmail(email);
}

export async function activateOrExtendSubscription({
  userId,
  email,
  subscriptionType = "monthly",
  paymentId,
  amount,
  provider = "lava",
  contractId = null,
  parentContractId = null,
}) {
  const resolvedUserId = await resolveUserId({ userId, email, contractId });
  if (!resolvedUserId) {
    throw new Error(`User not found for email: ${email || "unknown"}`);
  }

  const userRef = doc(db, "users", resolvedUserId);
  const userDoc = await getDoc(userRef);
  const now = new Date();
  const durationMonths = getPlanDurationMonths(subscriptionType);

  let startDate = now;
  let endDate = addMonths(now, durationMonths);

  if (userDoc.exists()) {
    const existing = userDoc.data().subscription;
    if (existing?.endDate) {
      let currentEnd = existing.endDate;
      if (currentEnd?.toDate) currentEnd = currentEnd.toDate();
      else if (currentEnd?.seconds) currentEnd = new Date(currentEnd.seconds * 1000);
      else if (typeof currentEnd === "string") currentEnd = new Date(currentEnd);

      if (!Number.isNaN(currentEnd?.getTime?.()) && currentEnd > now) {
        startDate = existing.startDate?.toDate?.() || existing.startDate || now;
        endDate = addMonths(currentEnd, durationMonths);
      }
    }
  }

  const subscriptionData = {
    active: true,
    type: subscriptionType,
    startDate: toTimestamp(startDate),
    endDate: toTimestamp(endDate),
    paymentId: paymentId || contractId || parentContractId || null,
    lavaContractId: contractId || null,
    lavaParentContractId: parentContractId || null,
    amount: amount ?? null,
    provider,
    updatedAt: serverTimestamp(),
  };

  if (!userDoc.exists()) {
    await setDoc(
      userRef,
      {
        email: email || null,
        subscription: subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await updateDoc(userRef, {
      ...(email ? { email } : {}),
      subscription: subscriptionData,
      updatedAt: serverTimestamp(),
    });
  }

  if (contractId) {
    const pendingRef = doc(db, "pendingLavaPayments", contractId);
    await setDoc(
      pendingRef,
      {
        processed: true,
        processedAt: serverTimestamp(),
        userId: resolvedUserId,
      },
      { merge: true }
    );
  }

  return { userId: resolvedUserId, subscription: subscriptionData };
}

export async function deactivateSubscription({ userId, email, willExpireAt }) {
  const resolvedUserId = await resolveUserId({ userId, email });
  if (!resolvedUserId) {
    throw new Error(`User not found for cancellation: ${email || "unknown"}`);
  }

  const userRef = doc(db, "users", resolvedUserId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return { userId: resolvedUserId };

  const existing = userDoc.data().subscription || {};
  const expireDate = willExpireAt ? new Date(willExpireAt) : new Date();

  await updateDoc(userRef, {
    subscription: {
      ...existing,
      active: expireDate > new Date(),
      cancelledAt: serverTimestamp(),
      endDate: toTimestamp(expireDate),
      updatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  return { userId: resolvedUserId };
}
