import { describe, expect, it } from "vitest";
import { PAGE_SIZE, pageHref, pageItems, pageRange, parsePage, totalPages } from "@/lib/pagination";

/** US-20 (GB-47) M1, M2, E1, B1, B2: pagination helpers. */

describe("M1 – 12 books per page", () => {
  it("uses 12 per page", () => expect(PAGE_SIZE).toBe(12));

  it("B2: asks the database for rows 0–11, 12–23, 24–35", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 11 });
    expect(pageRange(2)).toEqual({ from: 12, to: 23 });
    expect(pageRange(3)).toEqual({ from: 24, to: 35 });
  });
});

describe("B1 – with 30 books there are 3 pages (12 + 12 + 6)", () => {
  it.each([
    [0, 1],
    [1, 1],
    [12, 1],
    [13, 2],
    [24, 2],
    [30, 3],
    [33, 3],
    [37, 4],
  ])("%i books → %i pages", (total, pages) => {
    expect(totalPages(total)).toBe(pages);
  });
});

describe("E1 – invalid page numbers → page 1", () => {
  it.each([undefined, "", "0", "-1", "-3", "abc", "1.5", "2e3", " "])("%s → 1", (raw) => {
    expect(parsePage(raw)).toBe(1);
  });

  it.each([
    ["1", 1],
    ["3", 3],
    [" 2 ", 2],
    [["4", "5"], 4],
  ] as const)("%s → %i", (raw, page) => {
    expect(parsePage(raw as string | string[])).toBe(page);
  });

  it("treats a huge number as invalid", () => {
    expect(parsePage("99999999999999999999")).toBe(1);
  });
});

describe("page numbers between Prev and Next", () => {
  it("shows every page up to 7", () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("shortens long lists with gaps", () => {
    expect(pageItems(1, 12)).toEqual([1, 2, "…", 12]);
    expect(pageItems(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(pageItems(12, 12)).toEqual([1, "…", 11, 12]);
    expect(pageItems(3, 12)).toEqual([1, 2, 3, 4, "…", 12]);
  });
});

describe("M2 – page number in the URL, other parameters kept", () => {
  it("puts ?page= in the link and drops it for page 1", () => {
    expect(pageHref("/books", {}, 3)).toBe("/books?page=3");
    expect(pageHref("/books", { page: "3" }, 1)).toBe("/books");
  });

  it("keeps search and filters (US-25)", () => {
    const params = { q: "harry potter", category: "abc", minPrice: "50000", page: "2" };
    expect(pageHref("/books", params, 3)).toBe("/books?q=harry+potter&category=abc&minPrice=50000&page=3");
  });
});
