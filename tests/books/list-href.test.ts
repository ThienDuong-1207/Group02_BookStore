import { describe, expect, it } from "vitest";
import { detailHref, safeListHref } from "@/lib/books/list-href";

/** US-22 M1 / B1: the "Back to list" URL carried in `?from=`, and why it can never leave the book list. */
describe("safeListHref", () => {
  it.each([
    ["/books", "/books"],
    ["/books?page=3", "/books?page=3"],
    ["/books?page=3&q=harry", "/books?page=3&q=harry"],
    [
      "/books?q=nh%C3%A0+gi%E1%BA%A3+kim&category=11111111-1111-4111-8111-111111111111&minPrice=0&maxPrice=200000&page=2",
      "/books?q=nh%C3%A0+gi%E1%BA%A3+kim&category=11111111-1111-4111-8111-111111111111&minPrice=0&maxPrice=200000&page=2",
    ],
  ])("M1: keeps the list page, search and filters: %s", (from, expected) => {
    expect(safeListHref(from)).toBe(expected);
  });

  it.each([undefined, "", []])("B1: no list page (opened directly) → /books page 1 (%j)", (from) => {
    expect(safeListHref(from as string | string[] | undefined)).toBe("/books");
  });

  it.each([
    "https://evil.example/books",
    "//evil.example/books",
    "/\\evil.example",
    "/books\\@evil.example",
    "/admin",
    "/admin/users?x=/books",
    "/books/33333333-3333-4333-8333-333333333333",
    "/books/../admin",
    "/booksX",
    "javascript:alert(1)",
    "books?page=2",
  ])("rejects anything that is not the book list: %s → /books", (from) => {
    expect(safeListHref(from)).toBe("/books");
  });

  it("takes the first value when `from` is repeated", () => {
    expect(safeListHref(["/books?page=2", "/admin"])).toBe("/books?page=2");
  });

  it("drops a nested `from` parameter", () => {
    expect(safeListHref("/books?page=2&from=%2Fbooks%3Fpage%3D9")).toBe("/books?page=2");
  });

  it("ignores absurdly long values", () => {
    expect(safeListHref(`/books?q=${"a".repeat(3000)}`)).toBe("/books");
  });
});

describe("detailHref", () => {
  const ID = "33333333-3333-4333-8333-333333333333";

  it("plain link from page 1 of the full list", () => {
    expect(detailHref(ID)).toBe(`/books/${ID}`);
    expect(detailHref(ID, "/books")).toBe(`/books/${ID}`);
  });

  it("carries the encoded list URL otherwise", () => {
    const href = detailHref(ID, "/books?page=3&q=harry");
    expect(href).toBe(`/books/${ID}?from=${encodeURIComponent("/books?page=3&q=harry")}`);
    const from = new URL(href, "http://x").searchParams.get("from");
    expect(safeListHref(from ?? undefined)).toBe("/books?page=3&q=harry");
  });
});
