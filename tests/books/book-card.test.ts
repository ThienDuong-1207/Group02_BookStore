import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookCard, type BookCardBook } from "@/components/books/BookCard";

/** US-19 (GB-46) M1, M3, E1: what one card on the customer list shows. */
const book: BookCardBook = {
  id: "33333333-3333-4333-8333-333333333333",
  title: "Clean Code",
  author_name: "Robert C. Martin",
  price: 120000,
  cover_url: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
};
const render = (value: BookCardBook) => renderToStaticMarkup(createElement(BookCard, { book: value }));

describe("BookCard (US-19)", () => {
  it("M1: shows cover, title, author and the price as 120.000 ₫", () => {
    const html = render(book);
    expect(html).toContain(`src="${book.cover_url}"`);
    expect(html).toContain('alt="Cover of Clean Code"');
    expect(html).toContain("Clean Code");
    expect(html).toContain("Robert C. Martin");
    expect(html).toMatch(/120\.000\s₫/);
  });

  it("M3: the card links to the detail page", () => {
    expect(render(book)).toContain(`href="/books/${book.id}"`);
  });

  it("E1: shows the placeholder when the book has no cover", () => {
    const html = render({ ...book, cover_url: null });
    expect(html).not.toContain("<img");
    expect(html).toContain('aria-label="No cover image"');
    expect(html).toContain("No cover");
  });

  it("E1: cuts long titles to 2 lines and keeps the full title as a tooltip", () => {
    const long = "A very long title ".repeat(10).trim();
    const html = render({ ...book, title: long });
    expect(html).toContain("line-clamp-2");
    expect(html).toContain(`title="${long}"`);
  });

  it("keeps covers in the 2 : 3 frame and loads them lazily", () => {
    const html = render(book);
    expect(html).toContain("aspect-[2/3]");
    expect(html).toContain('loading="lazy"');
  });

  it("escapes book data (no HTML injection from titles)", () => {
    const html = render({ ...book, title: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
  });
});

/** US-06 M2 / B1: "Sold Out" badge on the customer card when stock = 0. */
describe("BookCard Sold Out badge (US-06)", () => {
  it("M2: stock 0 → Sold Out badge on the card", () => {
    const html = render({ ...book, stock: 0 });
    expect(html).toContain("Sold Out");
    expect(html).toContain("bg-danger-surface");
  });

  it("B1: stock 1 or more → no badge (0 → 1 removes it)", () => {
    expect(render({ ...book, stock: 1 })).not.toContain("Sold Out");
    expect(render({ ...book, stock: 25 })).not.toContain("Sold Out");
  });

  it("no stock information → no badge", () => {
    expect(render(book)).not.toContain("Sold Out");
  });

  it("the card still shows the price and links to the detail page when sold out", () => {
    const html = render({ ...book, stock: 0 });
    expect(html).toMatch(/120\.000\s₫/);
    expect(html).toContain(`href="/books/${book.id}"`);
  });
});
