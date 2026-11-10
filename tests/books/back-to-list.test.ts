import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-22 (task 3.3.2) M1, E1, B1 end to end: the list page puts its URL in every card link, the detail page's
 * "Back to list" uses it, and the not-found page offers the same way back. Queries and Next.js are mocked.
 */

const ID = "33333333-3333-4333-8333-333333333333";
const CATEGORY = "11111111-1111-4111-8111-111111111111";
let searchParamsFrom: string | null = null;

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/queries/book-list", () => ({
  listPublicBooks: async () => ({
    total: 40,
    books: [
      { id: ID, title: "Harry Potter", price: 100000, stock: 1, cover_url: null, author_name: "J. K. Rowling", category_name: "Fiction", created_at: "2026-11-01T00:00:00Z" },
    ],
  }),
}));
vi.mock("@/lib/queries/categories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queries/categories")>("@/lib/queries/categories");
  return { ...actual, listMenuCategories: async () => [{ id: CATEGORY, name: "Fiction" }] };
});
vi.mock("@/lib/queries/promotions", () => ({ getPromotionsForBooks: async () => new Map() }));
vi.mock("@/lib/queries/book-detail", () => ({
  getPublicBook: async (_supabase: unknown, id: string) =>
    id === ID
      ? { id: ID, title: "Harry Potter", description: "A boy wizard.", price: 100000, stock: 1, cover_url: null, author_name: "J. K. Rowling", category_id: CATEGORY, category_name: "Fiction" }
      : null,
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect ${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/books",
  useSearchParams: () => new URLSearchParams(searchParamsFrom ? { from: searchParamsFrom } : {}),
}));

const { default: BooksPage } = await import("@/app/(public)/books/page");
const { default: BookDetailPage } = await import("@/app/(public)/books/[id]/page");
const { default: BookNotFound } = await import("@/app/(public)/books/[id]/not-found");

const decode = (href: string) => href.replaceAll("&amp;", "&");

async function cardHref(params: Record<string, string>): Promise<string> {
  const html = renderToStaticMarkup(await BooksPage({ searchParams: Promise.resolve(params) }));
  const href = html.match(new RegExp(`href="(/books/${ID}[^"]*)"`))?.[1];
  if (!href) throw new Error("card link not found");
  return decode(href);
}

async function backHref(searchParams?: Record<string, string>): Promise<string> {
  const html = renderToStaticMarkup(
    await BookDetailPage({ params: Promise.resolve({ id: ID }), searchParams: searchParams && Promise.resolve(searchParams) }),
  );
  const href = html.match(/href="([^"]*)"[^>]*>(?:<span[^>]*>←<\/span>\s*)?Back to list/)?.[1];
  if (!href) throw new Error("Back to list link not found");
  return decode(href);
}

beforeEach(() => {
  searchParamsFrom = null;
});

describe("US-22 M1 – back to the same list page with the same search / filter", () => {
  it("a card on page 3 of a search carries that list URL", async () => {
    const href = await cardHref({ page: "3", q: "harry", category: CATEGORY });
    const from = new URL(href, "http://x").searchParams.get("from");
    const list = new URL(from ?? "", "http://x");
    expect(list.pathname).toBe("/books");
    expect(Object.fromEntries(list.searchParams)).toEqual({ page: "3", q: "harry", category: CATEGORY });
  });

  it("the detail page's 'Back to list' returns to exactly that page", async () => {
    const href = await cardHref({ page: "3", q: "harry", minPrice: "50000" });
    const from = new URL(href, "http://x").searchParams.get("from") ?? "";
    const back = new URL(await backHref({ from }), "http://x");
    expect(back.pathname).toBe("/books");
    expect(Object.fromEntries(back.searchParams)).toEqual({ page: "3", q: "harry", minPrice: "50000" });
  });

  it("a card on page 1 of the full list keeps the plain /books/<id> link", async () => {
    expect(await cardHref({})).toBe(`/books/${ID}`);
  });
});

describe("US-22 B1 – detail opened directly", () => {
  it("'Back to list' goes to /books page 1", async () => {
    expect(await backHref()).toBe("/books");
    expect(await backHref({})).toBe("/books");
  });

  it("a forged `from` pointing elsewhere also falls back to /books", async () => {
    expect(await backHref({ from: "https://evil.example/books" })).toBe("/books");
    expect(await backHref({ from: "/admin" })).toBe("/books");
  });
});

describe("US-22 E1 – book not found", () => {
  it("unknown / deleted / malformed id → notFound() (HTTP 404 page)", async () => {
    await expect(BookDetailPage({ params: Promise.resolve({ id: "not-a-book" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("the not-found page shows a friendly message, no technical error", () => {
    const html = renderToStaticMarkup(createElement(BookNotFound));
    expect(html).toContain("Book not found");
    expect(html).toContain("Sorry, we couldn&#x27;t find this book.");
    expect(html).not.toMatch(/error|stack|exception|PGRST|undefined/i);
  });

  it("its 'Back to list' goes to the list page the visitor came from", () => {
    searchParamsFrom = "/books?page=2&q=harry";
    const html = renderToStaticMarkup(createElement(BookNotFound));
    expect(html).toContain('href="/books?page=2&amp;q=harry"');
  });

  it("…or to /books when opened directly or with a forged `from`", () => {
    expect(renderToStaticMarkup(createElement(BookNotFound))).toContain('href="/books"');
    searchParamsFrom = "//evil.example";
    expect(renderToStaticMarkup(createElement(BookNotFound))).toContain('href="/books"');
  });
});
