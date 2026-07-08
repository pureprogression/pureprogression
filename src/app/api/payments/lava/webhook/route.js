import { NextResponse } from "next/server";
import {
  activateOrExtendSubscription,
  deactivateSubscription,
} from "@/lib/subscriptionService";

function verifyWebhookAuth(request) {
  const webhookSecret = process.env.LAVA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Lava Webhook] LAVA_WEBHOOK_SECRET is not configured");
    return false;
  }

  const apiKey = request.headers.get("x-api-key");
  if (apiKey && apiKey === webhookSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice("Basic ".length);
    try {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const [login, password] = decoded.split(":");
      const expectedLogin = process.env.LAVA_WEBHOOK_BASIC_LOGIN;
      const expectedPassword = process.env.LAVA_WEBHOOK_BASIC_PASSWORD;
      if (
        expectedLogin &&
        expectedPassword &&
        login === expectedLogin &&
        password === expectedPassword
      ) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

function getSubscriptionType(payload) {
  return payload?.clientUtm?.utm_content || "monthly";
}

function getUserId(payload) {
  return payload?.clientUtm?.utm_campaign || null;
}

export async function POST(request) {
  try {
    if (!verifyWebhookAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const eventType = payload?.eventType;
    const status = payload?.status;
    const email = payload?.buyer?.email;
    const contractId = payload?.contractId;
    const parentContractId = payload?.parentContractId || null;
    const amount = payload?.amount;
    const subscriptionType = getSubscriptionType(payload);
    const userId = getUserId(payload);

    console.log("[Lava Webhook] Received:", {
      eventType,
      status,
      email,
      contractId,
      subscriptionType,
      userId,
    });

    if (
      eventType === "payment.success" &&
      status === "subscription-active"
    ) {
      await activateOrExtendSubscription({
        userId,
        email,
        subscriptionType,
        paymentId: contractId,
        amount,
        contractId,
        parentContractId,
      });
      return NextResponse.json({ success: true, action: "activated" });
    }

    if (eventType === "subscription.recurring.payment.success") {
      await activateOrExtendSubscription({
        userId,
        email,
        subscriptionType,
        paymentId: contractId,
        amount,
        contractId,
        parentContractId,
      });
      return NextResponse.json({ success: true, action: "extended" });
    }

    if (eventType === "subscription.cancelled") {
      await deactivateSubscription({
        userId,
        email,
        willExpireAt: payload?.willExpireAt,
      });
      return NextResponse.json({ success: true, action: "cancelled" });
    }

    if (
      eventType === "payment.failed" ||
      eventType === "subscription.recurring.payment.failed"
    ) {
      console.warn("[Lava Webhook] Payment failed:", payload?.errorMessage);
      return NextResponse.json({ success: true, action: "ignored_failed" });
    }

    return NextResponse.json({ success: true, action: "ignored", eventType });
  } catch (error) {
    console.error("[Lava Webhook] Error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}
