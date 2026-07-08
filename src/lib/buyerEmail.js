export function getBuyerEmail(user) {
  if (!user) return null;

  const direct = user.email?.trim();
  if (direct) return direct.toLowerCase();

  for (const provider of user.providerData || []) {
    const email = provider.email?.trim();
    if (email) return email.toLowerCase();
  }

  return null;
}

export function normalizeBuyerEmail(email) {
  if (email == null) return null;
  const normalized = String(email).trim().toLowerCase();
  return normalized || null;
}
