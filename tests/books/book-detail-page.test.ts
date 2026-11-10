import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookDetail } from "@/lib/queries/book-detail";

/** US-02 (task 3.3.1) M1, M2: what `/books/[id]` shows. The book query and Next.js navigation are mocked. */

const ID = "33333333-3333-4333-8333-333333333333";
const CATEGORY = "11111111-1111-4111-8111-111111111111";
const book: BookDetail = {
  id: ID,
  title: "Clean Code: A Handbook of Agile Software Craftsmanship",
  description: "First paragraph.\nSecond paragraph about <b>tags</b>.",
  price: 120000,
  stock: 5,
  cover_url: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
  author_name: "Robert C. Martin",
  category_id: CATEGORY,
  category_name: "Technology",
};

let stored: BookDetail | null = book;
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/queries/book-detail", () => ({ getPublicBook: async () => stored }));

class NotFoundSignal extends Error {}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundSignal();
  },
}));

const page = await import("@/app/(public)/books/[id]/page");
const render = async (id = ID) => renderToStaticMarkup(await page.default({ params: Promise.resolve({ id }) }));

beforeEach(() => {
  stored = { ...book };
});

describe("Book detail page (US-02)", () => {
  it("M1: shows cover, title, author, category, price and full description", async () => {
    const html = await render();
    expect(html).toContain(`src="${book.cover_url}"`);
    expect(html).toContain("Clean Code: A Handbook of Agile Software Craftsmanship</h1>");
    expect(html).toContain("Robert C. Martin");
    expect(html).toContain("Technology");
    expect(html).toMatch(/120\.000\s₫/);
    expect(html).toContain("First paragraph.\nSecond paragraph");
    expect(html).toContain("whitespace-pre-line"); // line breaks of the description are kept
  });

  it("M1: stock > 0 → 'In stock'", async () => {
    const html = await render();
    expect(html).toContain("In stock");
    expect(html).not.toContain("Sold Out");
  });

  it("M1: stock = 0 → 'Sold Out'", async () => {
    stored = { ...book, stock: 0 };
    const html = await render();
    expect(html).toContain("Sold Out");
    expect(html).not.toContain("In stock");
  });

  it("M2: no Add to Cart button or any cart / buy action", async () => {
    const html = (await render()).toLowerCase();
    expect(html).not.toContain("add to cart");
    expect(html).not.toContain("cart");
    expect(html).not.toContain("buy now");
  });

  it("shows the placeholder cover when the book has no cover link", async () => {
    stored = { ...book, cover_url: null };
    expect(await render()).toContain('aria-label="No cover image"');
  });

  it("the category links to the list filtered by that category", async () => {
    expect(await render()).toContain(`href="/books?category=${CATEGORY}"`);
  });

  it("escapes book data (no HTML from the description is rendered)", async () => {
    const html = await render();
    expect(html).not.toContain("<b>tags</b>");
    expect(html).toContain("&lt;b&gt;tags&lt;/b&gt;");
  });

  it("calls notFound() when the book does not exist, is deleted or hidden", async () => {
    stored = null;
    await expect(render()).rejects.toBeInstanceOf(NotFoundSignal);
  });

  it("uses the book title as the page title", async () => {
    await expect(page.generateMetadata({ params: Promise.resolve({ id: ID }) })).resolves.toEqual({
      title: "Clean Code: A Handbook of Agile Software Craftsmanship – Book Store",
    });
    stored = null;
    await expect(page.generateMetadata({ params: Promise.resolve({ id: "x" }) })).resolves.toEqual({
      title: "Book not found – Book Store",
    });
  });
});
