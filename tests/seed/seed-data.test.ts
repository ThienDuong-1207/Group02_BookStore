import { describe, expect, it } from "vitest";
import { AUTHORS, BOOKS, CATEGORIES, coverUrl, seedCreatedAt } from "../../scripts/seed-data";

/** US-23 (GB-40): the seed data itself satisfies the AC and the DB constraints in 20261027000001_schema.sql. */

describe("US-23 M1 – amount of sample data", () => {
  it("has at least 30 books, 5 categories and 10 authors", () => {
    expect(BOOKS.length).toBeGreaterThanOrEqual(30);
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5);
    expect(AUTHORS.length).toBeGreaterThanOrEqual(10);
  });

  it("every category is used by at least one book", () => {
    for (const category of CATEGORIES) expect(BOOKS.some((book) => book.category === category)).toBe(true);
  });
});

describe("US-23 M2 – every book is complete and valid", () => {
  it.each(BOOKS.map((book) => [book.title, book] as const))("%s", (_title, book) => {
    expect(book.title.length).toBeGreaterThanOrEqual(1);
    expect(book.title.length).toBeLessThanOrEqual(200);
    expect(book.description.length).toBeGreaterThanOrEqual(1);
    expect(book.description.length).toBeLessThanOrEqual(5000);
    expect(Number.isInteger(book.price) && book.price > 0).toBe(true);
    expect(Number.isInteger(book.stock) && book.stock >= 0).toBe(true);
    expect(book.author.trim().length).toBeGreaterThanOrEqual(1);
    expect(book.isbn).toMatch(/^97[89]\d{10}$/);
    expect(coverUrl(book.isbn)).toMatch(/^https:\/\/covers\.openlibrary\.org\/b\/isbn\/\d{13}-L\.jpg\?default=false$/);
  });

  it("at least 2 books have stock = 0 (to test Sold Out)", () => {
    expect(BOOKS.filter((book) => book.stock === 0).length).toBeGreaterThanOrEqual(2);
  });
});

describe("US-23 B1 / B2 – ordering and no duplicates", () => {
  it("every book gets a different created_at, increasing with its position", () => {
    const dates = BOOKS.map((_, index) => seedCreatedAt(index));
    expect(new Set(dates).size).toBe(BOOKS.length);
    for (let i = 1; i < dates.length; i++) expect(Date.parse(dates[i])).toBeGreaterThan(Date.parse(dates[i - 1]));
  });

  it("title + author is unique (the key the seed uses to skip existing books)", () => {
    const keys = BOOKS.map((book) => `${book.title.toLowerCase()}|${book.author.toLowerCase()}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("category and author names are unique case-insensitively (like the DB unique indexes)", () => {
    expect(new Set(CATEGORIES.map((c) => c.toLowerCase())).size).toBe(CATEGORIES.length);
    expect(new Set(AUTHORS.map((a) => a.toLowerCase())).size).toBe(AUTHORS.length);
  });
});
