import { describe, expect, it } from "vitest";
import { discountedPrice, effectivePrice, isPromotionActive, promotionStatus, todayInVietnam } from "@/lib/promotions/price";

/** US-26 AC4 (CR-02): the effective-price service used by the list (US-27) and the detail page (US-28). */

const promo = { discount_percent: 20, start_date: "2026-11-10", end_date: "2026-11-15" };

describe("discountedPrice – original × (1 − x %), rounded to whole VND", () => {
  it.each([
    [120000, 20, 96000],
    [120000, 15, 102000],
    [95000, 33, 63650],
    [99999, 50, 50000], // 49999.5 rounds up
    [1, 90, 0],
    [100000, 1, 99000],
    [100000, 90, 10000],
  ])("%i at %i %% → %i", (price, percent, expected) => {
    expect(discountedPrice(price, percent)).toBe(expected);
  });
});

describe("isPromotionActive – only from start date to end date, both included", () => {
  it.each([
    ["2026-11-09", false], // the day before
    ["2026-11-10", true], // start date (boundary)
    ["2026-11-12", true],
    ["2026-11-15", true], // end date (boundary)
    ["2026-11-16", false], // after the end date (CR-02 AC4)
  ])("on %s → %s", (today, expected) => {
    expect(isPromotionActive(promo, today)).toBe(expected);
  });

  it("is never active without a promotion", () => {
    expect(isPromotionActive(null, "2026-11-12")).toBe(false);
  });

  it("supports a one-day promotion (start = end)", () => {
    expect(isPromotionActive({ ...promo, end_date: "2026-11-10" }, "2026-11-10")).toBe(true);
  });
});

describe("effectivePrice", () => {
  it("uses the discounted price during the promotion", () => {
    expect(effectivePrice(120000, promo, "2026-11-12")).toEqual({ price: 96000, originalPrice: 120000, discountPercent: 20 });
  });

  it.each([null, undefined])("uses the original price without a promotion (%s)", (none) => {
    expect(effectivePrice(120000, none, "2026-11-12")).toEqual({ price: 120000, originalPrice: 120000, discountPercent: null });
  });

  it.each(["2026-11-09", "2026-11-16"])("uses the original price outside the dates (%s)", (today) => {
    expect(effectivePrice(120000, promo, today).price).toBe(120000);
  });
});

describe("promotionStatus", () => {
  it.each([
    ["2026-11-01", "Scheduled"],
    ["2026-11-10", "Active"],
    ["2026-11-20", "Ended"],
  ] as const)("on %s → %s", (today, status) => {
    expect(promotionStatus(promo, today)).toBe(status);
  });
});

describe("todayInVietnam", () => {
  it("uses Vietnam time (UTC+7), not the server time zone", () => {
    expect(todayInVietnam(new Date("2026-11-14T16:59:59Z"))).toBe("2026-11-14");
    expect(todayInVietnam(new Date("2026-11-14T17:00:00Z"))).toBe("2026-11-15");
  });
});
