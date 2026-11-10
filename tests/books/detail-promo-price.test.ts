import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookDetail } from "@/lib/queries/book-detail";
import type { PromotionRow } from "@/lib/queries/promotions";

/**
 * US-28 (CR-02) AC1–AC3: the promotional price on `/books/[id]`.
 * "Today" is fixed to 2026-11-12 (Vietnam date) so the date rules are deterministic.
 */

const ID = "33333333-3333-4333-8333-333333333333";
const book: BookDetail = {
  id: ID,
  title: "Sách khuyến mãi",
  description: "Mô tả.",
  price: 100000,
  stock: 4,
  cover_url: null,
  author_name: "Nguyễn Nhật Ánh",
  category_id: "11111111-1111-4111-8111-111111111111",
  category_name: "Văn học",
};

let promotion: PromotionRow | null = null;
let promotionFails = false;
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/queries/book-detail", () => ({ getPublicBook: async () => book }));
vi.mock("@/lib/queries/promotions", () => ({
  getPromotion: async () => {
    if (promotionFails) throw new Error("network down");
    return promotion;
  },
}));
vi.mock("@/lib/promotions/price", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/promotions/price")>()),
  todayInVietnam: () => "2026-11-12",
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("not found");
  },
}));

const page = await import("@/app/(public)/books/[id]/page");
const render = async () => renderToStaticMarkup(await page.default({ params: Promise.resolve({ id: ID }) }));
const promo = (start: string, end: string, percent = 20): PromotionRow => ({
  book_id: ID,
  discount_percent: percent,
  start_date: start,
  end_date: end,
});

beforeEach(() => {
  promotion = null;
  promotionFails = false;
});

describe("Detail page promotional price (US-28)", () => {
  it("AC1: active 20 % promotion → original struck through, sale price and -20%", async () => {
    promotion = promo("2026-11-01", "2026-11-30");
    const html = await render();
    expect(html).toMatch(/<del[^>]*>100\.000\s₫<\/del>/);
    expect(html).toMatch(/80\.000\s₫/);
    expect(html).toContain("-20%");
  });

  it("AC2 (CR-02 AC4): today after the end date → only the original price", async () => {
    promotion = promo("2026-11-01", "2026-11-11");
    const html = await render();
    expect(html).toMatch(/100\.000\s₫/);
    expect(html).not.toContain("<del");
    expect(html).not.toContain("-20%");
  });

  it("AC2: promotion not started yet → only the original price", async () => {
    promotion = promo("2026-11-13", "2026-11-30");
    const html = await render();
    expect(html).not.toContain("<del");
    expect(html).not.toMatch(/80\.000\s₫/);
  });

  it("AC3: today = start date → promotion active", async () => {
    promotion = promo("2026-11-12", "2026-11-30", 10);
    expect(await render()).toContain("-10%");
  });

  it("AC3: today = end date → promotion active", async () => {
    promotion = promo("2026-11-01", "2026-11-12", 10);
    const html = await render();
    expect(html).toContain("-10%");
    expect(html).toMatch(/90\.000\s₫/);
  });

  it("no promotion → only the original price", async () => {
    const html = await render();
    expect(html).toMatch(/100\.000\s₫/);
    expect(html).not.toContain("<del");
  });

  it("promotion lookup fails → page still renders with the original price", async () => {
    promotionFails = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    const html = await render();
    expect(html).toMatch(/100\.000\s₫/);
    expect(html).not.toContain("<del");
  });
});
