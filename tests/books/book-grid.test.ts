import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookGrid } from "@/components/books/BookGrid";
import type { BookCardBook } from "@/components/books/BookCard";

/** US-19 (GB-46) M2, E2, AC4: the "New books" grid. */
const books: BookCardBook[] = [
  { id: "b-new", title: "Newest book", author_name: "A", price: 100000, cover_url: null },
  { id: "b-mid", title: "Middle book", author_name: "B", price: 90000, cover_url: null },
  { id: "b-old", title: "Oldest book", author_name: "C", price: 80000, cover_url: null },
];
const render = (value: BookCardBook[]) => renderToStaticMarkup(createElement(BookGrid, { books: value }));

describe("BookGrid (US-19)", () => {
  it("AC4: 1 column on phones, 2 from 768 px (md), 4 from 1024 px (lg)", () => {
    const html = render(books);
    expect(html).toMatch(/class="[^"]*\bgrid grid-cols-1\b[^"]*\bmd:grid-cols-2\b[^"]*\blg:grid-cols-4\b/);
  });

  it("M2: keeps the order of the query (newest first)", () => {
    const html = render(books);
    expect(html.indexOf("Newest book")).toBeLessThan(html.indexOf("Middle book"));
    expect(html.indexOf("Middle book")).toBeLessThan(html.indexOf("Oldest book"));
  });

  it("renders one card per book", () => {
    expect(render(books).match(/<li /g)).toHaveLength(3);
  });

  it("E2: shows 'No books available yet.' and no grid when there are no books", () => {
    const html = render([]);
    expect(html).toContain("No books available yet.");
    expect(html).not.toContain("<ul");
  });
});
