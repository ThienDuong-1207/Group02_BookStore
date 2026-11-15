import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BookCard, type BookCardBook } from "@/components/books/BookCard";
import { BookList } from "@/components/admin/BookList";
import { bookSchema, stockSchema } from "@/lib/validation/books";

/**
 * US-06 (GB-11) "Sold Out" label + stock rules.
 * AC1: stock 0 → "Sold Out" on the list (card) and the detail page (tests/books/book-detail-page.test.ts).
 * AC2: negative stock is rejected when saving (same schema on the client form and in the server action;
 *      the action itself is tested in tests/admin/update-book.test.ts).
 * AC3 (boundary): 0 → label, 1 → no label.
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/books", useRouter: () => ({ push: vi.fn() }) }));

const book: BookCardBook = { id: "b1", title: "Clean Code", author_name: "Robert C. Martin", price: 120000, cover_url: null, stock: 0 };
const card = (stock: number | undefined) => renderToStaticMarkup(createElement(BookCard, { book: { ...book, stock } }));

describe("US-06 AC1 / AC3 – Sold Out label on the list card", () => {
  it("stock 0 → 'Sold Out' on the card", () => {
    expect(card(0)).toContain("Sold Out");
  });

  it.each([1, 2, 50])("stock %i → no label (it disappears as soon as stock is raised from 0)", (stock) => {
    expect(card(stock)).not.toContain("Sold Out");
  });

  it("no stock information → no label (never claims Sold Out without data)", () => {
    expect(card(undefined)).not.toContain("Sold Out");
  });

  it("the card still links to the detail page and shows the price when sold out", () => {
    const html = card(0);
    expect(html).toContain('href="/books/b1"');
    expect(html).toMatch(/120\.000\s₫/);
  });
});

describe("US-06 M1 – admin book list", () => {
  const rows = [
    { id: "a", title: "Sold out book", price: 100000, stock: 0, created_at: "2026-11-01T00:00:00Z", author_name: "A", category_name: "C" },
    { id: "b", title: "Available book", price: 100000, stock: 7, created_at: "2026-11-01T00:00:00Z", author_name: "B", category_name: "C" },
  ];
  const html = renderToStaticMarkup(createElement(BookList, { books: rows }));

  it("shows every book's stock", () => {
    expect(html).toContain(">7<");
    expect(html).toMatch(/Stock 0/);
  });

  it("marks only the book with stock 0 as Sold Out (phone cards + desktop table)", () => {
    expect(html.match(/Sold Out/g)).toHaveLength(2); // once in the card list, once in the table
    const tableRowB = html.match(/<tr[^>]*>(?:(?!<\/tr>)[\s\S])*Available book[\s\S]*?<\/tr>/)?.[0] ?? "";
    expect(tableRowB).not.toContain("Sold Out");
  });
});

describe("US-06 AC2 – stock must be a whole number ≥ 0", () => {
  it.each(["-1", "-50", "1.5", "abc", ""])("rejects %j", (value) => {
    expect(stockSchema.safeParse(value).success).toBe(false);
  });

  it.each([
    ["0", 0],
    ["1", 1],
  ])("accepts %j (boundary)", (value, parsed) => {
    expect(stockSchema.safeParse(value)).toMatchObject({ success: true, data: parsed });
  });

  it("the book form shows the stock message for -1", () => {
    const result = bookSchema.safeParse({
      title: "T",
      authorId: "11111111-1111-4111-8111-111111111111",
      categoryId: "22222222-2222-4222-8222-222222222222",
      price: "1000",
      stock: "-1",
      description: "D",
      coverUrl: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.path[0] === "stock")?.message).toBe(
      "Stock must be a whole number of 0 or more",
    );
  });
});
