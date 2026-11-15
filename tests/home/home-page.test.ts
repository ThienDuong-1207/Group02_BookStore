import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Home page `/` (PROJECT_SPEC §6, approved by the PO on 11/11/2026): hero with search, numbers, categories,
 * books on sale, the 8 newest books and links into `/books`. Queries are mocked; the page is rendered to HTML.
 */

const CATEGORY = "11111111-1111-4111-8111-111111111111";
const book = (n: number) => ({
  id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
  title: `Book ${n}`,
  price: 100000 + n,
  stock: n === 2 ? 0 : 5,
  cover_url: n === 1 ? null : `https://example.com/${n}.jpg`,
  author_name: `Author ${n}`,
  category_name: "Fiction",
  created_at: "2026-11-01T00:00:00Z",
});

let newest = Array.from({ length: 12 }, (_, index) => book(index + 1));
let total = 34;
let categories = [{ id: CATEGORY, name: "Fiction" }];
let onSale: unknown[] | Error = [];

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/queries/book-list", () => ({ listPublicBooks: async () => ({ books: newest, total }) }));
vi.mock("@/lib/queries/categories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queries/categories")>("@/lib/queries/categories");
  return { ...actual, listMenuCategories: async () => categories };
});
vi.mock("@/lib/queries/promotions", () => ({ getPromotionsForBooks: async () => new Map() }));
vi.mock("@/lib/queries/home", () => ({
  listOnSaleBooks: async () => {
    if (onSale instanceof Error) throw onSale;
    return onSale;
  },
}));

const { default: HomePage } = await import("@/app/page");
const render = async () => renderToStaticMarkup(await HomePage());

beforeEach(() => {
  newest = Array.from({ length: 12 }, (_, index) => book(index + 1));
  total = 34;
  categories = [{ id: CATEGORY, name: "Fiction" }];
  onSale = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("Home page", () => {
  it("hero: one h1 and a search form that sends GET /books?q=", async () => {
    const html = await render();
    expect(html.match(/<h1/g)).toHaveLength(1);
    const form = html.match(/<form[^>]*>/)?.[0] ?? "";
    expect(form).toContain('action="/books"');
    expect(form).toContain('method="get"');
    expect(form).toContain('role="search"');
    expect(html).toContain('name="q"');
    expect(html).toMatch(/maxlength="100"/i);
  });

  it("shows the real numbers of the catalogue", async () => {
    const html = await render();
    expect(html).toMatch(/>34<\/dd>/);
    expect(html).toMatch(/>1<\/dd>/); // one category
    expect(html).toContain("category");
  });

  it("New books: only the 8 newest, in the order of the query, each card linking to its detail page", async () => {
    const html = await render();
    const cards = [...html.matchAll(/href="\/books\/(00000000-[^"?]+)/g)].map((match) => match[1]);
    expect(cards).toEqual(newest.slice(0, 8).map((item) => item.id));
    expect(html).toContain("Book 8");
    expect(html).not.toContain("Book 9");
    expect(html).toMatch(/100\.001\s₫/);
  });

  it("keeps the card rules of the list: Sold Out badge and cover placeholder", async () => {
    const html = await render();
    expect(html).toContain("Sold Out"); // book 2 has stock 0
    expect(html).toContain('aria-label="No cover image"'); // book 1 has no cover
  });

  it("links into the full list and to each visible category", async () => {
    const html = await render();
    expect(html).toContain('href="/books"');
    expect(html).toContain(`href="/books?category=${CATEGORY}"`);
    expect(html).toContain("Browse by category");
  });

  it("no categories → the category section is left out", async () => {
    categories = [];
    expect(await render()).not.toContain("Browse by category");
  });

  it("On sale today appears only when a promotion is active, with struck original price and -x%", async () => {
    expect(await render()).not.toContain("On sale today");
    onSale = [{ ...book(20), pricing: { price: 80000, originalPrice: 100020, discountPercent: 20 } }];
    const html = await render();
    expect(html).toContain("On sale today");
    expect(html).toMatch(/<del[^>]*>100\.020\s₫<\/del>/);
    expect(html).toMatch(/80\.000\s₫/);
    expect(html).toContain("-20%");
  });

  it("promotions cannot be read → the page still renders, without the sale section", async () => {
    onSale = new Error("database down");
    const html = await render();
    expect(html).toContain("New books");
    expect(html).not.toContain("On sale today");
  });

  it("empty catalogue → 'No books available yet.' and no broken hero", async () => {
    newest = [];
    total = 0;
    const html = await render();
    expect(html).toContain("No books available yet.");
    expect(html).toMatch(/>0<\/dd>/);
  });

  it("M2 (US-02): there is no Add to Cart button", async () => {
    expect((await render()).toLowerCase()).not.toContain("add to cart");
  });
});
