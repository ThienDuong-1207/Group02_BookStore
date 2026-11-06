import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookCard, type BookCardBook } from "@/components/books/BookCard";
import { withEffectivePrices } from "@/lib/books/card-price";
import type { Promotion } from "@/lib/promotions/price";

/** US-27 (GB-102, CR-02 AC3): promotional price on the book list. */

const TODAY = "2026-11-12";
const books = [
  { id: "sale", title: "On sale", author_name: "A", price: 150000, cover_url: null },
  { id: "none", title: "No promotion", author_name: "B", price: 120000, cover_url: null },
  { id: "later", title: "Starts later", author_name: "C", price: 100000, cover_url: null },
  { id: "ended", title: "Ended", author_name: "D", price: 90000, cover_url: null },
];
const promotions = new Map<string, Promotion>([
  ["sale", { discount_percent: 20, start_date: "2026-11-10", end_date: "2026-11-15" }],
  ["later", { discount_percent: 30, start_date: "2026-11-13", end_date: "2026-11-20" }],
  ["ended", { discount_percent: 50, start_date: "2026-11-01", end_date: "2026-11-11" }],
]);

describe("withEffectivePrices", () => {
  const priced = Object.fromEntries(withEffectivePrices(books, promotions, TODAY).map((book) => [book.id, book.pricing]));

  it("AC1: an active 20 % promotion → 150.000 becomes 120.000 with discount 20", () => {
    expect(priced.sale).toEqual({ price: 120000, originalPrice: 150000, discountPercent: 20 });
  });

  it.each(["none", "later", "ended"])("AC2: %s → only the original price", (id) => {
    const book = books.find((item) => item.id === id)!;
    expect(priced[id]).toEqual({ price: book.price, originalPrice: book.price, discountPercent: null });
  });

  it("first and last day of the promotion are both included (US-26 rule)", () => {
    const sale = [books[0]];
    expect(withEffectivePrices(sale, promotions, "2026-11-10")[0].pricing.discountPercent).toBe(20);
    expect(withEffectivePrices(sale, promotions, "2026-11-15")[0].pricing.discountPercent).toBe(20);
    expect(withEffectivePrices(sale, promotions, "2026-11-16")[0].pricing.discountPercent).toBeNull();
  });

  it("keeps the books, their order and their other fields", () => {
    const result = withEffectivePrices(books, promotions, TODAY);
    expect(result.map((book) => book.id)).toEqual(["sale", "none", "later", "ended"]);
    expect(result[0].title).toBe("On sale");
  });
});

const render = (book: BookCardBook) => renderToStaticMarkup(createElement(BookCard, { book }));

describe("BookCard price (US-27)", () => {
  it("AC1: original price struck through, discounted price and a '-20%' label", () => {
    const [book] = withEffectivePrices([books[0]], promotions, TODAY);
    const html = render(book);
    expect(html).toMatch(/<del[^>]*>150\.000\s₫<\/del>/);
    expect(html).toMatch(/text-accent[^>]*>120\.000\s₫</);
    expect(html).toContain(">-20%<");
    expect(html).toContain("Original price");
    expect(html).toContain("Sale price");
  });

  it("AC2: without an active promotion only the original price, no label, nothing struck through", () => {
    const [book] = withEffectivePrices([books[3]], promotions, TODAY);
    const html = render(book);
    expect(html).toMatch(/90\.000\s₫/);
    expect(html).not.toContain("<del");
    expect(html).not.toMatch(/-\d+%/);
  });

  it("without pricing data the card falls back to the original price (US-19 behaviour)", () => {
    const html = render(books[1]);
    expect(html).toMatch(/120\.000\s₫/);
    expect(html).not.toContain("<del");
  });
});
