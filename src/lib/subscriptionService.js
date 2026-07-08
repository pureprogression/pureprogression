import { getAdminDb, adminFieldValue, adminTimestamp } from "@/lib/firebaseAdmin";
import { getPlanDurationMonths } from "@/constants/lavaSubscription";
import { normalizeBuyerEmail } from "@/lib/buyerEmail";

function toTimestamp(value) {
  if (!value) return null;
  if (value instanceof adminTimestamp) return value;
  if (value?.toDate) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return adminTimestamp.fromDate(date);
}

export function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export async function findUserIdByEmail(email) {
  const normalized = normalizeBuyerEmail(email);
  if (!normalized) return null;

  const db = getAdminDb();
  const queries = [normalized];
  if (email && String(email).trim() !== normalized) {
    queries.push(String(email).trim());
  }

  for (const candidate of queries) {
    const snapshot = await db
      .collection("users")
      .where("email", "==", candidate)
      .limit(1)
      .get();
    if (!snapshot.empty) return snapshot.docs[0].id;
  }

  return null;
}

async function resolveUserId({ userId, email, contractId }) {
  if (userId) return userId;

  if (contractId) {
    const pendingDoc = await getAdminDb()
      .collection("pendingLavaPayments")
      .doc(contractId)
      .get();
    if (pendingDoc.exists) {
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

  const db = getAdminDb();
  const userRef = db.collection("users").doc(resolvedUserId);
  const userDoc = await userRef.get();
  const now = new Date();
  const durationMonths = getPlanDurationMonths(subscriptionType);
  const buyerEmail = normalizeBuyerEmail(email);

  let startDate = now;
  let endDate = addMonths(now, durationMonths);

  if (userDoc.exists) {
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
    updatedAt: adminFieldValue.serverTimestamp(),
  };

  if (!userDoc.exists) {
    await userRef.set(
      {
        email: buyerEmail || null,
        subscription: subscriptionData,
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await userRef.set(
      {
        ...(buyerEmail ? { email: buyerEmail } : {}),
        subscription: subscriptionData,
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  if (contractId) {
    await db.collection("pendingLavaPayments").doc(contractId).set(
      {
        processed: true,
        processedAt: adminFieldValue.serverTimestamp(),
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

  const db = getAdminDb();
  const userRef = db.collection("users").doc(resolvedUserId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return { userId: resolvedUserId };

  const existing = userDoc.data().subscription || {};
  const expireDate = willExpireAt ? new Date(willExpireAt) : new Date();

  await userRef.update({
    subscription: {
      ...existing,
      active: expireDate > new Date(),
      cancelledAt: adminFieldValue.serverTimestamp(),
      endDate: toTimestamp(expireDate),
      updatedAt: adminFieldValue.serverTimestamp(),
    },
    updatedAt: adminFieldValue.serverTimestamp(),
  });

  return { userId: resolvedUserId };
}
