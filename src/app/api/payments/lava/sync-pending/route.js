import { NextResponse } from "next/server";
import { getAdminDb, adminFieldValue } from "@/lib/firebaseAdmin";
import { fetchLavaInvoice, fetchLavaSubscriptions, isLavaPaymentCompleted } from "@/lib/lava";
import { normalizeBuyerEmail } from "@/lib/buyerEmail";
import { activateOrExtendSubscription } from "@/lib/subscriptionService";
import { periodicityToPlanKey } from "@/constants/lavaSubscription";

async function loadPendingPayments(userId, contractId) {
  const db = getAdminDb();

  if (contractId) {
    const pendingDoc = await db.collection("pendingLavaPayments").doc(contractId).get();
    if (!pendingDoc.exists) return [];
    const data = pendingDoc.data();
    if (data.userId !== userId || data.processed) return [];
    return [{ id: pendingDoc.id, data }];
  }

  const snapshot = await db
    .collection("pendingLavaPayments")
    .where("userId", "==", userId)
    .where("processed", "==", false)
    .get();

  return snapshot.docs.map((pendingDoc) => ({
    id: pendingDoc.id,
    data: pendingDoc.data(),
  }));
}

async function activateFromLavaSubscriptions(userId, email) {
  const result = await fetchLavaSubscriptions(email);
  const items = result?.items || [];

  const paid = items.find((item) => {
    const buyer = normalizeBuyerEmail(item.buyer?.email);
    const subscriptionStatus = String(item.subscriptionStatus || "").toUpperCase();
    const status = String(item.status || "").toUpperCase();
    return (
      buyer === email &&
      (subscriptionStatus === "ACTIVE" || isLavaPaymentCompleted(item))
    );
  });

  if (!paid?.id) return null;

  return activateOrExtendSubscription({
    userId,
    email,
    subscriptionType:
      paid.clientUtm?.utm_content ||
      periodicityToPlanKey(paid.periodicity) ||
      "monthly",
    paymentId: paid.id,
    amount: paid.receipt?.amount ?? null,
    contractId: paid.id,
  });
}

export async function POST(request) {
  try {
    const { userId, email, contractId } = await request.json();
    const buyerEmail = normalizeBuyerEmail(email);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!process.env.LAVA_API_KEY) {
      return NextResponse.json(
        { error: "LAVA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const pendingPayments = await loadPendingPayments(userId, contractId);

    for (const pending of pendingPayments) {
      const invoice = await fetchLavaInvoice(pending.id);
      if (!isLavaPaymentCompleted(invoice)) {
        continue;
      }

      const result = await activateOrExtendSubscription({
        userId,
        email: pending.data.email || invoice.buyer?.email || buyerEmail,
        subscriptionType: pending.data.subscriptionType || "monthly",
        paymentId: pending.id,
        amount: invoice.receipt?.amount ?? null,
        contractId: pending.id,
      });

      return NextResponse.json({
        success: true,
        action: "activated",
        userId: result.userId,
        contractId: pending.id,
      });
    }

    if (buyerEmail) {
      const result = await activateFromLavaSubscriptions(userId, buyerEmail);
      if (result) {
        return NextResponse.json({
          success: true,
          action: "activated_from_lava",
          userId: result.userId,
        });
      }
    }

    if (pendingPayments.length === 0 && !buyerEmail) {
      return NextResponse.json(
        { error: "No pending Lava payments found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      action: "pending",
      message: "Payment not completed yet in Lava",
    });
  } catch (error) {
    console.error("[Lava Sync Pending] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync pending payment" },
      { status: 500 }
    );
  }
}
