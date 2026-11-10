import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-25 (search / filter works with pagination): renders the real `/books` page with search + filters in the URL.
 * The list query, the category list, the promotions and Next.js navigation are mocked, so the test checks what the
 * page itself does with the URL: which filters and page it asks for, and where every link and redirect goes.
 */

const CATEGORY = "11111111-1111-4111-8111-111111111111";

type ListCall = { page: number; filters: Record<string, unknown> };
const listCalls: ListCall[] = [];
let total = 30;

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/queries/book-list", () => ({
  listPublicBooks: async (_supabase: unknown, page: number, filters: Record<string, unknown> = {}) => {
    listCalls.push({ page, filters });
    const from = (page - 1) * 12;
    const count = Math.max(0, Math.min(12, total - from));
    const books = Array.from({ length: count }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(from + index).padStart(12, "0")}`,
      title: `Book ${from + index + 1}`,
      price: 100000,
      stock: 3,
      cover_url: null,
      author_name: "Author",
      category_name: "Fiction",
      created_at: "2026-11-01T00:00:00Z",
    }));
    return { books, total };
  },
}));
vi.mock("@/lib/queries/categories", async () => {
  const actual = await vi.importActual<typeof import("@/lib/queries/categories")>("@/lib/queries/categories");
  return { ...actual, listMenuCategories: async () => [{ id: CATEGORY, name: "Fiction" }] };
});
vi.mock("@/lib/queries/promotions", () => ({ getPromotionsForBooks: async () => new Map() }));

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(url);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/books",
}));

const { default: BooksPage } = await import("@/app/(public)/books/page");

type Params = Record<string, string>;
async function render(params: Params): Promise<{ html: string } | { redirectedTo: string }> {
  try {
    return { html: renderToStaticMarkup(await BooksPage({ searchParams: Promise.resolve(params) })) };
  } catch (error) {
    if (error instanceof RedirectSignal) return { redirectedTo: error.url };
    throw error;
  }
}
async function html(params: Params): Promise<string> {
  const result = await render(params);
  if (!("html" in result)) throw new Error(`unexpected redirect to ${result.redirectedTo}`);
  return result.html;
}

/** Every `href` of the pagination block, decoded and parsed. */
function pageLinks(markup: string): URL[] {
  const nav = markup.match(/<nav aria-label="Pagination"[\s\S]*?<\/nav>/)?.[0] ?? "";
  return [...nav.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1].replaceAll("&amp;", "&"), "http://x"));
}

const ALL_FILTERS: Params = { q: "harry", category: CATEGORY, minPrice: "50000", maxPrice: "200000" };

beforeEach(() => {
  listCalls.length = 0;
  total = 30;
});

describe("US-25 M1 – moving between pages keeps the search and the filters", () => {
  it("asks the database for the requested page with every filter", async () => {
    await html({ ...ALL_FILTERS, page: "2" });
    expect(listCalls).toEqual([
      { page: 2, filters: { q: "harry", categoryId: CATEGORY, minPrice: 50000, maxPrice: 200000 } },
    ]);
  });

  it("every page link (Prev, numbers, Next) keeps q, category, minPrice and maxPrice", async () => {
    const links = pageLinks(await html({ ...ALL_FILTERS, page: "2" }));
    expect(links.length).toBeGreaterThanOrEqual(4); // Prev, 1, 3, Next
    for (const link of links) {
      expect(link.pathname).toBe("/books");
      for (const [key, value] of Object.entries(ALL_FILTERS)) expect(link.searchParams.get(key)).toBe(value);
    }
    const pages = links.map((link) => link.searchParams.get("page") ?? "1");
    expect(pages).toContain("1");
    expect(pages).toContain("3");
  });

  it("a keyword with spaces and Vietnamese letters survives the page links", async () => {
    const links = pageLinks(await html({ q: "nhà giả kim", page: "1" }));
    expect(links.every((link) => link.searchParams.get("q") === "nhà giả kim")).toBe(true);
  });
});

describe("US-25 M2 – changing the keyword or a filter starts again on page 1", () => {
  it("the search / filter form does not send the current page", async () => {
    const markup = await html({ ...ALL_FILTERS, page: "3" });
    const form = markup.match(/<form[^>]*aria-label="Search and filter books"[\s\S]*?<\/form>/)?.[0] ?? "";
    expect(form).not.toBe("");
    expect(form).not.toMatch(/name="page"/);
  });

  it("'Clear search' on 'No results found' keeps the other filters but drops the page", async () => {
    total = 0;
    const markup = await html({ ...ALL_FILTERS, page: "1" });
    const clear = markup.match(/href="([^"]+)"[^>]*>Clear search</)?.[1];
    const url = new URL((clear ?? "").replaceAll("&amp;", "&"), "http://x");
    expect(url.searchParams.get("q")).toBeNull();
    expect(url.searchParams.get("category")).toBe(CATEGORY);
    expect(url.searchParams.get("page")).toBeNull();
  });
});

describe("US-25 B1 – the page count uses the filtered total", () => {
  it.each([
    [30, 3],
    [13, 2],
    [12, 1],
  ])("%i matching books → %i page(s)", async (count, pages) => {
    total = count;
    const markup = await html({ ...ALL_FILTERS });
    if (pages === 1) {
      expect(pageLinks(markup)).toHaveLength(0); // no page controls for a single page
    } else {
      expect(markup).toContain(`Page 1 of ${pages}`);
      const numbers = pageLinks(markup).map((link) => link.searchParams.get("page") ?? "1");
      expect(numbers).toContain(String(pages));
      expect(numbers).not.toContain(String(pages + 1));
    }
  });

  it("a page past the end of the FILTERED results goes to its last page and keeps the filters", async () => {
    total = 13; // 2 pages of results
    const result = await render({ ...ALL_FILTERS, page: "9" });
    expect(result).toHaveProperty("redirectedTo");
    const url = new URL((result as { redirectedTo: string }).redirectedTo, "http://x");
    expect(url.searchParams.get("page")).toBe("2");
    for (const [key, value] of Object.entries(ALL_FILTERS)) expect(url.searchParams.get(key)).toBe(value);
  });
});

describe("US-25 B2 – search, category and price combine (AND)", () => {
  it("passes all conditions to one query, never one after the other", async () => {
    await html({ ...ALL_FILTERS });
    expect(listCalls).toHaveLength(1);
    expect(listCalls[0].filters).toEqual({ q: "harry", categoryId: CATEGORY, minPrice: 50000, maxPrice: 200000 });
  });

  it("an invalid price range is not applied, but the other filters still are", async () => {
    await html({ q: "harry", category: CATEGORY, minPrice: "300000", maxPrice: "100000", page: "1" });
    expect(listCalls[0].filters).toEqual({ q: "harry", categoryId: CATEGORY });
  });
});
