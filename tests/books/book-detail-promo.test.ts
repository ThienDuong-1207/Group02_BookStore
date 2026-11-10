import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Promotion } from "@/lib/promotions/price";

/**
 * US-28 (GB-104, CR-02 part 2): promotional price on the book detail page.
 * The book, the promotion and "today" are controlled by the test; the price itself comes from the real US-26
 * service, so the detail page is checked against exactly the same rule as the list (US-27).
 */

const ID = "33333333-3333-4333-8333-333333333333";
const book = {
  id: ID,
  title: "Clean Code",
  description: "A handbook.",
  price: 150000,
  stock: 5,
  cover_url: null,
  author_name: "Robert C. Martin",
  category_id: "11111111-1111-4111-8111-111111111111",
  category_name: "Technology",
};
const PROMO: Promotion = { discount_percent: 20, start_date: "2026-11-10", end_date: "2026-11-15" };

let promotion: Promotion | null = PROMO;
let promotionFails = false;
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/queries/book-detail", () => ({ getPublicBook: async () => book }));
vi.mock("@/lib/queries/promotions", () => ({
  getPromotion: async (_supabase: unknown, id: string) => {
    if (promotionFails) throw new Error("promotions table missing");
    return id === ID ? promotion : null;
  },
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const { default: BookDetailPage } = await import("@/app/(public)/books/[id]/page");

/** Renders the page as if today (Vietnam time) were `day`, at noon. */
async function renderOn(day: string): Promise<string> {
  vi.setSystemTime(new Date(`${day}T12:00:00+07:00`));
  return renderToStaticMarkup(await BookDetailPage({ params: Promise.resolve({ id: ID }) }));
}

beforeEach(() => {
  vi.useFakeTimers();
  promotion = PROMO;
  promotionFails = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("US-28 AC1 – active promotion on the detail page", () => {
  it("original price struck through, sale price and a '-20%' label", async () => {
    const html = await renderOn("2026-11-12");
    expect(html).toMatch(/<del[^>]*>150\.000\s₫<\/del>/);
    expect(html).toMatch(/text-accent[^>]*>120\.000\s₫</);
    expect(html).toContain(">-20%<");
    expect(html).toContain("Original price");
    expect(html).toContain("Sale price");
  });

  it("tells the customer when the promotion ends", async () => {
    expect(await renderOn("2026-11-12")).toContain("Promotion until 15/11/2026");
  });

  it("rounds like the list and the admin preview (95.000 ₫ at 33 % → 63.650 ₫)", async () => {
    promotion = { ...PROMO, discount_percent: 33 };
    book.price = 95000;
    try {
      expect(await renderOn("2026-11-12")).toMatch(/63\.650\s₫/);
    } finally {
      book.price = 150000;
    }
  });
});

describe("US-28 AC2 (CR-02 AC4) – no active promotion → only the original price", () => {
  it.each([
    ["the day after the end date", "2026-11-16"],
    ["before the start date", "2026-11-09"],
  ])("%s", async (_label, day) => {
    const html = await renderOn(day);
    expect(html).toMatch(/150\.000\s₫/);
    expect(html).not.toContain("<del");
    expect(html).not.toMatch(/-\d+%/);
    expect(html).not.toContain("Promotion until");
  });

  it("a book without a promotion", async () => {
    promotion = null;
    const html = await renderOn("2026-11-12");
    expect(html).toMatch(/150\.000\s₫/);
    expect(html).not.toContain("<del");
  });

  it("if the promotion cannot be loaded, the page still works with the original price", async () => {
    promotionFails = true;
    const html = await renderOn("2026-11-12");
    expect(html).toMatch(/150\.000\s₫/);
    expect(html).not.toContain("<del");
  });
});

describe("US-28 AC3 (boundary) – start and end days are both included", () => {
  it.each(["2026-11-10", "2026-11-15"])("on %s the sale price is shown", async (day) => {
    const html = await renderOn(day);
    expect(html).toMatch(/text-accent[^>]*>120\.000\s₫</);
    expect(html).toContain(">-20%<");
  });

  it("23:30 on the end day in Vietnam still counts", async () => {
    vi.setSystemTime(new Date("2026-11-15T23:30:00+07:00"));
    const html = renderToStaticMarkup(await BookDetailPage({ params: Promise.resolve({ id: ID }) }));
    expect(html).toContain(">-20%<");
  });

  it("uses the Vietnam calendar day: 00:30 on 16/11 in Vietnam (still 15/11 in UTC) no longer counts", async () => {
    vi.setSystemTime(new Date("2026-11-16T00:30:00+07:00"));
    const html = renderToStaticMarkup(await BookDetailPage({ params: Promise.resolve({ id: ID }) }));
    expect(html).not.toContain("<del");
  });
});
