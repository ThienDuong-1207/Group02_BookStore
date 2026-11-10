import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/** US-06 AC1 end to end on `/books`: the stock read by the list query reaches the card. */

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/queries/book-list", () => ({
  listPublicBooks: async () => ({
    total: 2,
    books: [
      { id: "00000000-0000-4000-8000-000000000001", title: "Out of stock", price: 50000, stock: 0, cover_url: null, author_name: "A", category_name: "C", created_at: "2026-11-02T00:00:00Z" },
      { id: "00000000-0000-4000-8000-000000000002", title: "In stock", price: 60000, stock: 3, cover_url: null, author_name: "B", category_name: "C", created_at: "2026-11-01T00:00:00Z" },
    ],
  }),
}));
vi.mock("@/lib/queries/categories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queries/categories")>("@/lib/queries/categories");
  return { ...actual, listMenuCategories: async () => [] };
});
vi.mock("@/lib/queries/promotions", () => ({ getPromotionsForBooks: async () => new Map() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/books",
}));

const { default: BooksPage } = await import("@/app/(public)/books/page");

describe("US-06 AC1 – Sold Out on the customer list", () => {
  it("only the card of the book with stock 0 has the label", async () => {
    const html = renderToStaticMarkup(await BooksPage({ searchParams: Promise.resolve({}) }));
    const cards = html.split("<li ").slice(1);
    const outOfStock = cards.find((item) => item.includes("Out of stock")) ?? "";
    const inStock = cards.find((item) => item.includes(">In stock<")) ?? "";
    expect(outOfStock).toContain("Sold Out");
    expect(inStock).not.toContain("Sold Out");
  });
});
