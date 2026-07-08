import { getBuyerEmail } from "@/lib/buyerEmail";

export async function syncLavaPaymentForUser(user) {
  if (!user?.uid || typeof window === "undefined") return null;

  const email = getBuyerEmail(user);
  const contractId = localStorage.getItem("last_subscription_payment_id");

  const response = await fetch("/api/payments/lava/sync-pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.uid,
      email: email || undefined,
      contractId: contractId || undefined,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Failed to sync Lava payment");
  }

  return data;
}
