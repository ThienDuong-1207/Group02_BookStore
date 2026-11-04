import { z } from "zod";
import { wholeNumber } from "@/lib/validation/books";

/**
 * US-26 promotion form rules, shared by the form and the server action (CR-02 AC1, AC2 on both sides).
 * Dates come from <input type="date"> as "YYYY-MM-DD".
 */

export const PROMOTION_MESSAGES = {
  discount: "Discount must be a whole number from 1 to 90 (%)",
  discountRequired: "Discount is required",
  startRequired: "Start date is required",
  endRequired: "End date is required",
  invalidDate: "Enter a valid date",
  endBeforeStart: "End date cannot be before the start date",
} as const;

/** A real calendar day in "YYYY-MM-DD" form: "2026-02-30" is rejected. */
function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isoDate(required: string) {
  return z.string(required).trim().min(1, required).refine(isValidIsoDate, PROMOTION_MESSAGES.invalidDate);
}

export const promotionSchema = z
  .object({
    // AC1: outside 1–90 → error. AC3 (boundary): exactly 1 and exactly 90 are accepted.
    discountPercent: wholeNumber({
      min: 1,
      max: 90,
      required: PROMOTION_MESSAGES.discountRequired,
      invalid: PROMOTION_MESSAGES.discount,
    }),
    startDate: isoDate(PROMOTION_MESSAGES.startRequired),
    endDate: isoDate(PROMOTION_MESSAGES.endRequired),
  })
  // AC2: end date before start date → error. AC3: end date = start date is accepted (a one-day promotion).
  // Only compared when both dates are valid, so an empty end date shows "End date is required" instead.
  .refine((value) => !(isValidIsoDate(value.startDate) && isValidIsoDate(value.endDate)) || value.endDate >= value.startDate, {
    path: ["endDate"],
    message: PROMOTION_MESSAGES.endBeforeStart,
  });
export type PromotionInput = z.infer<typeof promotionSchema>;

export const PROMOTION_FIELDS = ["discountPercent", "startDate", "endDate"] as const;
