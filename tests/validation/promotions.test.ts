import { describe, expect, it } from "vitest";
import { toFieldErrors } from "@/lib/validation/auth";
import { PROMOTION_MESSAGES, promotionSchema } from "@/lib/validation/promotions";

/** US-26 CR-02 AC1, AC2 + team boundary AC3: the schema used by the promotion form and the server action. */

const valid = { discountPercent: "20", startDate: "2026-11-10", endDate: "2026-11-15" };
function errorsFor(change: Record<string, string>) {
  const result = promotionSchema.safeParse({ ...valid, ...change });
  // First message per field, exactly what the form shows.
  return result.success ? {} : toFieldErrors(result.error);
}

describe("AC1 – discount outside 1–90 is rejected", () => {
  it.each(["0", "91", "100", "-5", "abc", "12.5", ""])("rejects %s", (discountPercent) => {
    expect(errorsFor({ discountPercent }).discountPercent).toBeTruthy();
  });

  it("shows the 1–90 message", () => {
    expect(errorsFor({ discountPercent: "91" }).discountPercent).toBe(PROMOTION_MESSAGES.discount);
  });
});

describe("AC2 – end date before start date is rejected", () => {
  it("rejects an end date one day before the start date", () => {
    expect(errorsFor({ endDate: "2026-11-09" }).endDate).toBe(PROMOTION_MESSAGES.endBeforeStart);
  });
});

describe("AC3 – boundaries are accepted", () => {
  it.each(["1", "90"])("accepts a discount of exactly %s", (discountPercent) => {
    expect(promotionSchema.parse({ ...valid, discountPercent }).discountPercent).toBe(Number(discountPercent));
  });

  it("accepts end date = start date", () => {
    expect(promotionSchema.safeParse({ ...valid, endDate: valid.startDate }).success).toBe(true);
  });
});

describe("dates", () => {
  it.each(["", "2026-02-30", "15/11/2026", "2026-13-01"])("rejects start date %s", (startDate) => {
    expect(errorsFor({ startDate }).startDate).toBeTruthy();
  });

  it("requires an end date", () => {
    expect(errorsFor({ endDate: "" }).endDate).toBe(PROMOTION_MESSAGES.endRequired);
  });
});
