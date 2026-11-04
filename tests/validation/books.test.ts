import { describe, expect, it } from "vitest";
import { bookSchema, toBookRow } from "@/lib/validation/books";

/** US-05 E1, B1–B4 (and US-15 E1): the schema used by both the book form and the server action. */

const valid = {
  title: "Clean Code",
  authorId: "11111111-1111-4111-8111-111111111111",
  categoryId: "22222222-2222-4222-8222-222222222222",
  price: "120000",
  stock: "5",
  description: "A handbook of agile software craftsmanship.",
  coverUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
};

function errorsFor(change: Record<string, string>) {
  const result = bookSchema.safeParse({ ...valid, ...change });
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
}

describe("valid book", () => {
  it("parses numbers and trims text", () => {
    const parsed = bookSchema.parse({ ...valid, title: "  Clean Code  " });
    expect(parsed).toMatchObject({ title: "Clean Code", price: 120000, stock: 5 });
  });

  it("maps to the books table columns", () => {
    expect(toBookRow(bookSchema.parse(valid))).toEqual({
      title: "Clean Code",
      author_id: valid.authorId,
      category_id: valid.categoryId,
      price: 120000,
      stock: 5,
      description: valid.description,
      cover_url: valid.coverUrl,
    });
  });
});

describe("US-05 E1 – required fields", () => {
  it.each(["title", "authorId", "categoryId", "price", "description"])("rejects an empty %s", (field) => {
    expect(errorsFor({ [field]: "" })[field]).toBeTruthy();
  });

  it("rejects a title of only spaces", () => {
    expect(errorsFor({ title: "   " }).title).toBe("Title is required");
  });
});

describe("US-05 B1 – price > 0, whole VND", () => {
  it.each(["0", "-1", "-5000", "abc", "12.5", "1e5"])("rejects %s", (price) => {
    expect(errorsFor({ price }).price).toBeTruthy();
  });

  it("accepts 1 (boundary)", () => {
    expect(bookSchema.parse({ ...valid, price: "1" }).price).toBe(1);
  });
});

describe("US-05 B2 / AC4 – stock ≥ 0", () => {
  it.each(["-1", "abc", "2.5", ""])("rejects %s", (stock) => {
    expect(errorsFor({ stock }).stock).toBeTruthy();
  });

  it("accepts 0 (boundary)", () => {
    expect(bookSchema.parse({ ...valid, stock: "0" }).stock).toBe(0);
  });
});

describe("US-05 B3 – lengths", () => {
  it("accepts a 200-character title and rejects 201", () => {
    expect(errorsFor({ title: "a".repeat(200) }).title).toBeUndefined();
    expect(errorsFor({ title: "a".repeat(201) }).title).toBeTruthy();
  });

  it("accepts a 5000-character description and rejects 5001", () => {
    expect(errorsFor({ description: "d".repeat(5000) }).description).toBeUndefined();
    expect(errorsFor({ description: "d".repeat(5001) }).description).toBeTruthy();
  });
});

describe("US-05 AC3 – cover image link format", () => {
  it.each(["not a link", "ftp://example.com/a.jpg", "javascript:alert(1)", "example.com/a.jpg"])("rejects %s", (coverUrl) => {
    expect(errorsFor({ coverUrl }).coverUrl).toBeTruthy();
  });

  it("allows an empty cover (placeholder is shown)", () => {
    const parsed = bookSchema.parse({ ...valid, coverUrl: "  " });
    expect(parsed.coverUrl).toBeUndefined();
    expect(toBookRow(parsed).cover_url).toBeNull();
  });
});
