/**
 * US-26 effective-price service (CR-02). Pure functions, so the list (US-27), the detail page (US-28)
 * and the admin preview all compute the price the same way.
 *
 * - A promotion is ACTIVE from its start date to its end date, both days included (US-26 AC3, US-28 AC3).
 * - Discounted price = original price × (1 − x %), rounded to whole VND (US-26 AC4).
 * - "Today" is the calendar day in Vietnam, whatever time zone the server runs in.
 */

export type Promotion = {
  discount_percent: number;
  start_date: string; // "YYYY-MM-DD"
  end_date: string; // "YYYY-MM-DD"
};

export type EffectivePrice = {
  /** What the customer pays today. */
  price: number;
  originalPrice: number;
  /** The active discount, or null when there is no active promotion. */
  discountPercent: number | null;
};

/** "2026-11-05" in Asia/Ho_Chi_Minh. */
export function todayInVietnam(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** ISO dates ("YYYY-MM-DD") compare correctly as strings. */
export function isPromotionActive(promotion: Promotion | null | undefined, today: string): boolean {
  return !!promotion && promotion.start_date <= today && today <= promotion.end_date;
}

/** 120000 at 15 % → 102000. Halves round up (Math.round), e.g. 99999 at 50 % → 50000. */
export function discountedPrice(price: number, discountPercent: number): number {
  return Math.round((price * (100 - discountPercent)) / 100);
}

export function effectivePrice(originalPrice: number, promotion: Promotion | null | undefined, today: string): EffectivePrice {
  if (!promotion || !isPromotionActive(promotion, today)) {
    return { price: originalPrice, originalPrice, discountPercent: null };
  }
  return {
    price: discountedPrice(originalPrice, promotion.discount_percent),
    originalPrice,
    discountPercent: promotion.discount_percent,
  };
}

/** "Scheduled" before the start date, "Active" during it, "Ended" after the end date. */
export function promotionStatus(promotion: Promotion, today: string): "Scheduled" | "Active" | "Ended" {
  if (today < promotion.start_date) return "Scheduled";
  if (today > promotion.end_date) return "Ended";
  return "Active";
}
