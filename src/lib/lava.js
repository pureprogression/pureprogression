const LAVA_API_BASE = process.env.LAVA_API_BASE_URL || "https://gate.lava.top";

export async function lavaApiFetch(path, options = {}) {
  const apiKey = process.env.LAVA_API_KEY;
  if (!apiKey) {
    throw new Error("LAVA_API_KEY is not configured");
  }

  const response = await fetch(`${LAVA_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      ...options.headers,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = data.error || data.message;
    if (data.details && typeof data.details === "object") {
      const detailMessage = Object.values(data.details)
        .filter((value) => typeof value === "string" && value.trim())
        .join(". ");
      if (detailMessage) message = detailMessage;
    }
    throw new Error(message || `Lava API error (${response.status})`);
  }

  return data;
}

export async function fetchLavaProducts() {
  const params = new URLSearchParams({
    productTypes: "SUBSCRIPTION",
    showAllSubscriptionPeriods: "true",
  });
  return lavaApiFetch(`/api/v2/products?${params.toString()}`);
}

export async function createLavaInvoice({
  email,
  offerId,
  currency = "RUB",
  periodicity,
  buyerLanguage = "EN",
  clientUtm,
}) {
  const body = {
    email,
    offerId,
    currency,
    periodicity,
    buyerLanguage,
  };

  if (clientUtm) {
    body.clientUtm = clientUtm;
  }

  return lavaApiFetch("/api/v3/invoice", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
