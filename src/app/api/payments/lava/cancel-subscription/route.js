import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cancelLavaSubscription, fetchLavaSubscriptions } from "@/lib/lava";
import { normalizeBuyerEmail } from "@/lib/buyerEmail";
import { deactivateSubscription } from "@/lib/subscriptionService";

function parseEndDate(subscription) {
  const end = subscription?.endDate;
  if (!end) return new Date();
  if (end.toDate) return end.toDate();
  if (end.seconds) return new Date(end.seconds * 1000);
  if (typeof end === "string") return new Date(end);
  if (end instanceof Date) return end;
  return new Date();
}

function getStoredContractId(subscription) {
  return (
    subscription?.lavaParentContractId ||
    subscription?.lavaContractId ||
    subscription?.paymentId ||
    null
  );
}

async function resolveContractId(subscription, email) {
  const stored = getStoredContractId(subscription);
  if (stored) return stored;

  const result = await fetchLavaSubscriptions(email);
  const items = result?.items || [];
  const active = items.find((item) => {
    const status = String(item.subscriptionStatus || "").toUpperCase();
    const buyer = normalizeBuyerEmail(item.buyer?.email);
    return buyer === email && status === "ACTIVE";
  });

  return active?.id || null;
}

export async function POST(request) {
  try {
    const { userId, email } = await request.json();
    const buyerEmail = normalizeBuyerEmail(email);

    if (!userId || !buyerEmail) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 }
      );
    }

    if (!process.env.LAVA_API_KEY) {
      return NextResponse.json(
        { error: "LAVA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const docEmail = normalizeBuyerEmail(userData.email);

    if (docEmail && docEmail !== buyerEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subscription = userData.subscription;
    if (!subscription?.active) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    if (subscription.cancelledAt) {
      return NextResponse.json({
        success: true,
        action: "already_cancelled",
        accessUntil: parseEndDate(subscription).toISOString(),
      });
    }

    const contractId = await resolveContractId(subscription, buyerEmail);
    if (!contractId) {
      return NextResponse.json(
        { error: "Subscription contract not found" },
        { status: 404 }
      );
    }

    await cancelLavaSubscription({ contractId, email: buyerEmail });

    const accessUntil = parseEndDate(subscription);
    await deactivateSubscription({
      userId,
      email: buyerEmail,
      willExpireAt: accessUntil,
    });

    return NextResponse.json({
      success: true,
      action: "cancelled",
      accessUntil: accessUntil.toISOString(),
    });
  } catch (error) {
    console.error("[Lava Cancel Subscription] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
