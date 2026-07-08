export const SUPPORTED_CURRENCIES = ["USD", "EUR", "RUB"];

export const CURRENCY_SYMBOLS = {
  RUB: "₽",
  USD: "$",
  EUR: "€",
};

export const PERIODICITY_TO_PLAN = {
  MONTHLY: "monthly",
  PERIOD_90_DAYS: "3months",
  PERIOD_180_DAYS: "6months",
  PERIOD_YEAR: "12months",
};

export const PLAN_SORT_ORDER = ["monthly", "3months", "6months", "12months"];

/** Порядок отображения на странице подписки (лучший план первым) */
export const PLAN_DISPLAY_ORDER = ["12months", "6months", "3months", "monthly"];

export const DEFAULT_PLAN_ID = "12months";

export const PLAN_BADGES = {
  "12months": "bestValue",
  "6months": "popular",
};

export const PLAN_DURATION_MONTHS = {
  monthly: 1,
  "3months": 3,
  "6months": 6,
  "12months": 12,
  yearly: 12,
};

export function periodicityToPlanKey(periodicity) {
  return PERIODICITY_TO_PLAN[periodicity] || null;
}

export function getPlanDurationMonths(subscriptionType) {
  return PLAN_DURATION_MONTHS[subscriptionType] || 1;
}

export function formatPlanPrice(amount, currency = "RUB") {
  if (amount == null) return "—";
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  if (currency === "USD") return `${symbol}${amount}`;
  if (currency === "EUR") return `${amount} ${symbol}`;
  return `${amount} ${symbol}`;
}

export function sortPlansForDisplay(plans) {
  return [...plans].sort(
    (a, b) => PLAN_DISPLAY_ORDER.indexOf(a.id) - PLAN_DISPLAY_ORDER.indexOf(b.id)
  );
}

export function getDefaultPlanId(plans) {
  return plans.find((p) => p.id === DEFAULT_PLAN_ID)?.id || plans[0]?.id || null;
}

/** Экономия в % относительно помесячной оплаты */
export function formatPlanMonthlyEquivalent(plan, currency) {
  const price = plan.prices?.[currency];
  const months = plan.durationMonths || PLAN_DURATION_MONTHS[plan.id] || 1;
  if (price == null || months <= 1) return null;
  const monthly = Math.round(price / months);
  return formatPlanPrice(monthly, currency);
}

export function getPlanSavingsPercent(plan, monthlyPlan, currency) {
  if (!monthlyPlan || plan.id === "monthly") return null;
  const monthlyPrice = monthlyPlan.prices?.[currency];
  const planPrice = plan.prices?.[currency];
  const months = plan.durationMonths || PLAN_DURATION_MONTHS[plan.id];
  if (!monthlyPrice || !planPrice || !months) return null;
  const equivalentMonthly = planPrice / months;
  const savings = Math.round((1 - equivalentMonthly / monthlyPrice) * 100);
  return savings > 0 ? savings : null;
}

export function getPlanPeriodLabel(planKey, language = "en") {
  const labels = {
    monthly: { ru: "1 месяц", en: "1 month" },
    "3months": { ru: "3 месяца", en: "3 months" },
    "6months": { ru: "6 месяцев", en: "6 months" },
    "12months": { ru: "12 месяцев", en: "12 months" },
  };
  const label = labels[planKey];
  if (!label) return planKey;
  return language === "ru" ? label.ru : label.en;
}

/** Нормализует ответ Lava GET /api/v2/products в планы для UI */
export function normalizeLavaPlans(apiResponse) {
  const byPlanKey = new Map();
  const items = apiResponse?.items || [];

  for (const item of items) {
    // Lava v2: продукт в items[] напрямую; старый вариант — обёртка PRODUCT + data
    let product = item;
    if (item?.type === "PRODUCT" && item?.data) {
      product = item.data;
    }
    if (!product || product.type !== "SUBSCRIPTION") continue;

    for (const offer of product.offers || []) {
      if (!offer.id) continue;

      const pricesByPeriodicity = new Map();
      for (const price of offer.prices || []) {
        if (!price.periodicity || !price.currency || price.amount == null) continue;
        const prices = pricesByPeriodicity.get(price.periodicity) || {};
        prices[price.currency] = price.amount;
        pricesByPeriodicity.set(price.periodicity, prices);
      }

      for (const [periodicity, prices] of pricesByPeriodicity) {
        const planKey = periodicityToPlanKey(periodicity);
        if (!planKey) continue;

        const existing = byPlanKey.get(planKey);
        if (!existing || Object.keys(prices).length > Object.keys(existing.prices).length) {
          byPlanKey.set(planKey, {
            id: planKey,
            offerId: offer.id,
            periodicity,
            title: getPlanPeriodLabel(planKey, "ru"),
            titleEn: getPlanPeriodLabel(planKey, "en"),
            description: offer.description || product.description || "",
            prices,
            durationMonths: getPlanDurationMonths(planKey),
          });
        }
      }
    }
  }

  return PLAN_SORT_ORDER.map((key) => byPlanKey.get(key)).filter(Boolean);
}
