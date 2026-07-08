import { NextResponse } from "next/server";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchLavaInvoice, isLavaPaymentCompleted } from "@/lib/lava";
import { activateOrExtendSubscription } from "@/lib/subscriptionService";

async function loadPendingPayments(userId, contractId) {
  if (contractId) {
    const pendingRef = doc(db, "pendingLavaPayments", contractId);
    const pendingDoc = await getDoc(pendingRef);
    if (!pendingDoc.exists()) return [];
    const data = pendingDoc.data();
    if (data.userId !== userId || data.processed) return [];
    return [{ id: pendingDoc.id, data }];
  }

  const pendingRef = collection(db, "pendingLavaPayments");
  const q = query(
    pendingRef,
    where("userId", "==", userId),
    where("processed", "==", false)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((pendingDoc) => ({
    id: pendingDoc.id,
    data: pendingDoc.data(),
  }));
}

export async function POST(request) {
  try {
    const { userId, contractId } = await request.json();

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
    if (pendingPayments.length === 0) {
      return NextResponse.json(
        { error: "No pending Lava payments found" },
        { status: 404 }
      );
    }

    for (const pending of pendingPayments) {
      const invoice = await fetchLavaInvoice(pending.id);
      if (!isLavaPaymentCompleted(invoice)) {
        continue;
      }

      const result = await activateOrExtendSubscription({
        userId,
        email: pending.data.email || invoice.buyer?.email,
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
