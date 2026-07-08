import { NextResponse } from "next/server";
import { fetchLavaProducts } from "@/lib/lava";
import { normalizeLavaPlans } from "@/constants/lavaSubscription";

export async function GET() {
  try {
    if (!process.env.LAVA_API_KEY) {
      return NextResponse.json(
        { error: "LAVA_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const data = await fetchLavaProducts();
    const plans = normalizeLavaPlans(data);

    if (plans.length === 0) {
      return NextResponse.json(
        {
          error: "No subscription plans found in Lava",
          details:
            "Create subscription products in lava.top (types: SUBSCRIPTION) with offers for 1, 3, 6 and 12 months.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ plans, source: "lava" });
  } catch (error) {
    console.error("[Lava Plans] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load plans from Lava" },
      { status: 500 }
    );
  }
}
