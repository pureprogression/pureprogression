import { NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createLavaInvoice } from "@/lib/lava";
import { normalizeBuyerEmail } from "@/lib/buyerEmail";
import {
  getPlanDurationMonths,
  periodicityToPlanKey,
  SUPPORTED_CURRENCIES,
} from "@/constants/lavaSubscription";

export async function POST(request) {
  try {
    const {
      userId,
      email,
      offerId,
      periodicity,
      subscriptionType,
      currency = "USD",
      buyerLanguage = "EN",
    } = await request.json();

    const buyerEmail = normalizeBuyerEmail(email);

    if (!userId || !buyerEmail || !offerId || !periodicity) {
      return NextResponse.json(
        { error: "Missing required fields: userId, email, offerId, periodicity" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return NextResponse.json(
        { error: `Unsupported currency: ${currency}` },
        { status: 400 }
      );
    }

    if (!process.env.LAVA_API_KEY) {
      return NextResponse.json(
        { error: "LAVA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const resolvedType =
      subscriptionType || periodicityToPlanKey(periodicity) || "monthly";

    const invoice = await createLavaInvoice({
      email: buyerEmail,
      offerId,
      currency,
      periodicity,
      buyerLanguage,
      clientUtm: {
        utm_source: "purep-web",
        utm_medium: "subscription",
        utm_campaign: userId,
        utm_content: resolvedType,
        utm_term: currency,
      },
    });

    if (!invoice?.paymentUrl) {
      return NextResponse.json(
        { error: "Lava did not return a payment URL" },
        { status: 502 }
      );
    }

    if (invoice.id) {
      await setDoc(doc(db, "pendingLavaPayments", invoice.id), {
        userId,
        email: buyerEmail,
        subscriptionType: resolvedType,
        offerId,
        periodicity,
        currency,
        durationMonths: getPlanDurationMonths(resolvedType),
        createdAt: serverTimestamp(),
        processed: false,
      });
    }

    return NextResponse.json({
      paymentId: invoice.id,
      redirectUrl: invoice.paymentUrl,
      status: invoice.status,
      provider: "lava",
    });
  } catch (error) {
    console.error("[Lava Subscription] Error:", error);
    return NextResponse.json(
      { error: error.message || "Subscription creation failed" },
      { status: 500 }
    );
  }
}
