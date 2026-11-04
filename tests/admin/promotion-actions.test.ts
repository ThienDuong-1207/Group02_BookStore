import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-26 (GB-99) AC1, AC2, AC3 + US-13 E3: calls the promotion actions directly, as someone bypassing the form would.
 */

let caller: "admin" | "customer" | "guest" = "admin";
vi.mock("@/lib/auth/profile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/profile")>("@/lib/auth/profile");
  return {
    ...actual,
    requireAdmin: async () => {
      if (caller === "guest") throw new actual.AuthorizationError(401);
      if (caller === "customer") throw new actual.AuthorizationError(403);
      return { id: "admin-1", email: "admin@bookstore.demo", full_name: "Demo Admin", role: "ADMIN", status: "ACTIVE" };
    },
  };
});

const BOOK_ID = "33333333-3333-4333-8333-333333333333";
let bookExists = true;
const upsert = vi.fn();
const remove = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "promotions") {
        return {
          upsert: async (row: unknown, options: unknown) => (upsert(row, options), { error: null }),
          delete: () => ({ eq: async (column: string, value: unknown) => (remove(column, value), { error: null }) }),
        };
      }
      const builder = {
        select: () => builder,
        eq: () => builder,
        is: () => builder,
        maybeSingle: async () => ({ data: bookExists ? { id: BOOK_ID, price: 120000 } : null, error: null }),
      };
      return builder;
    },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { removePromotionAction, savePromotionAction } = await import("@/lib/admin/promotion-actions");
const { ACCESS_MESSAGES } = await import("@/lib/admin/check-admin");
const { BOOK_MESSAGES } = await import("@/lib/admin/book-messages");
const { PROMOTION_MESSAGES } = await import("@/lib/validation/promotions");

const valid = { discountPercent: "20", startDate: "2026-11-10", endDate: "2026-11-15" };
function form(values: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  caller = "admin";
  bookExists = true;
  vi.clearAllMocks();
});

describe("US-13 E3 – only admins can set promotions", () => {
  it.each([
    ["guest", ACCESS_MESSAGES.notLoggedIn],
    ["customer", ACCESS_MESSAGES.forbidden],
  ] as const)("rejects a %s", async (who, message) => {
    caller = who;
    await expect(savePromotionAction(BOOK_ID, {}, form(valid))).resolves.toEqual({ formError: message });
    await expect(removePromotionAction(BOOK_ID, {}, form())).resolves.toEqual({ formError: message });
    expect(upsert).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("US-26 – save a promotion", () => {
  it("upserts one promotion per book", async () => {
    await expect(savePromotionAction(BOOK_ID, {}, form(valid))).resolves.toEqual({ success: "Promotion saved" });
    expect(upsert).toHaveBeenCalledWith(
      { book_id: BOOK_ID, discount_percent: 20, start_date: "2026-11-10", end_date: "2026-11-15" },
      { onConflict: "book_id" },
    );
  });

  it("AC1: rejects a discount outside 1–90 on the server", async () => {
    const result = await savePromotionAction(BOOK_ID, {}, form({ ...valid, discountPercent: "91" }));
    expect(result.fieldErrors?.discountPercent).toBe(PROMOTION_MESSAGES.discount);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("AC2: rejects an end date before the start date on the server", async () => {
    const result = await savePromotionAction(BOOK_ID, {}, form({ ...valid, endDate: "2026-11-01" }));
    expect(result.fieldErrors?.endDate).toBe(PROMOTION_MESSAGES.endBeforeStart);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("AC3: accepts 1 %, 90 % and a one-day promotion", async () => {
    for (const values of [
      { ...valid, discountPercent: "1" },
      { ...valid, discountPercent: "90" },
      { ...valid, endDate: valid.startDate },
    ]) {
      await expect(savePromotionAction(BOOK_ID, {}, form(values))).resolves.toEqual({ success: "Promotion saved" });
    }
    expect(upsert).toHaveBeenCalledTimes(3);
  });

  it("rejects a deleted or unknown book", async () => {
    bookExists = false;
    await expect(savePromotionAction(BOOK_ID, {}, form(valid))).resolves.toEqual({ formError: BOOK_MESSAGES.notFound });
    expect(upsert).not.toHaveBeenCalled();
  });
});

describe("US-26 – remove a promotion", () => {
  it("deletes the promotion of that book only", async () => {
    await expect(removePromotionAction(BOOK_ID, {}, form())).resolves.toEqual({ success: "Promotion removed" });
    expect(remove).toHaveBeenCalledWith("book_id", BOOK_ID);
  });
});
