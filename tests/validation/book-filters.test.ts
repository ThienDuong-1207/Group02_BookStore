import { describe, expect, it } from "vitest";
import {
  FILTER_MESSAGES,
  filtersHref,
  hasActiveFilters,
  parseListParams,
  parsePriceRange,
} from "@/lib/validation/book-filters";

/** US-09 (GB-14): price range rules, URL parsing (server side) and the URL the filter form builds. */

const CAT = "3f1c2a8e-9b7d-4e6f-8a5b-1c2d3e4f5a6b";

describe("parsePriceRange", () => {
  it("AC2: min ≤ max → both applied", () => {
    expect(parsePriceRange("90000", "110000")).toEqual({ minPrice: 90000, maxPrice: 110000, errors: {} });
  });

  it("B1: min = max is allowed (inclusive range)", () => {
    expect(parsePriceRange("120000", "120000")).toEqual({ minPrice: 120000, maxPrice: 120000, errors: {} });
  });

  it("B2: only min or only max (open-ended)", () => {
    expect(parsePriceRange("50000", "")).toEqual({ minPrice: 50000, maxPrice: undefined, errors: {} });
    expect(parsePriceRange("", "50000")).toEqual({ minPrice: undefined, maxPrice: 50000, errors: {} });
    expect(parsePriceRange("", "")).toEqual({ minPrice: undefined, maxPrice: undefined, errors: {} });
  });

  it("0 is a valid lower bound", () => {
    expect(parsePriceRange("0", "100")).toEqual({ minPrice: 0, maxPrice: 100, errors: {} });
  });

  it("AC3 (E1): min > max → error, no price filter", () => {
    expect(parsePriceRange("200000", "100000")).toEqual({ errors: { range: FILTER_MESSAGES.range } });
    expect(FILTER_MESSAGES.range).toBe("Minimum price cannot be greater than maximum price");
  });

  it("E2: negative, decimal or non-numeric prices → message, no price filter", () => {
    expect(parsePriceRange("-5", "")).toEqual({ errors: { minPrice: FILTER_MESSAGES.minPrice } });
    expect(parsePriceRange("", "abc")).toEqual({ errors: { maxPrice: FILTER_MESSAGES.maxPrice } });
    expect(parsePriceRange("1.5", "")).toEqual({ errors: { minPrice: FILTER_MESSAGES.minPrice } });
    expect(parsePriceRange("-1", "x")).toEqual({
      errors: { minPrice: FILTER_MESSAGES.minPrice, maxPrice: FILTER_MESSAGES.maxPrice },
    });
  });

  it("trims spaces", () => {
    expect(parsePriceRange(" 1000 ", " 2000")).toEqual({ minPrice: 1000, maxPrice: 2000, errors: {} });
  });
});

describe("parseListParams (server side, NFR-4)", () => {
  it("no parameters → full list, no errors", () => {
    expect(parseListParams({})).toEqual({
      values: { q: "", category: "", minPrice: "", maxPrice: "" },
      filters: {},
      errors: {},
    });
  });

  it("B2 (US-25): search + category + price are combined", () => {
    const parsed = parseListParams({ q: " Harry ", category: CAT, minPrice: "90000", maxPrice: "110000" });
    expect(parsed.filters).toEqual({ q: "Harry", categoryId: CAT, minPrice: 90000, maxPrice: 110000 });
    expect(parsed.errors).toEqual({});
  });

  it("AC3: a hand-typed min > max shows the error and drops only the price filter", () => {
    const parsed = parseListParams({ category: CAT, minPrice: "200000", maxPrice: "100000" });
    expect(parsed.filters).toEqual({ categoryId: CAT });
    expect(parsed.errors).toEqual({ range: FILTER_MESSAGES.range });
    expect(parsed.values).toMatchObject({ minPrice: "200000", maxPrice: "100000" });
  });

  it("ignores a malformed category id", () => {
    const parsed = parseListParams({ category: "fiction'; drop table books;--" });
    expect(parsed.filters).toEqual({});
    expect(parsed.values.category).toBe("");
  });

  it("uses the first value of a repeated parameter", () => {
    expect(parseListParams({ minPrice: ["10", "20"] }).filters).toEqual({ minPrice: 10 });
  });
});

describe("filtersHref", () => {
  it("leaves empty fields out and never keeps page (US-25 M2: back to page 1)", () => {
    expect(filtersHref({ q: "", category: "", minPrice: "", maxPrice: "" })).toBe("/books");
    expect(filtersHref({ q: " harry ", category: CAT, minPrice: "", maxPrice: "50000" })).toBe(
      `/books?q=harry&category=${CAT}&maxPrice=50000`,
    );
  });

  it("encodes the keyword", () => {
    expect(filtersHref({ q: "dế mèn & co" })).toBe("/books?q=d%E1%BA%BF+m%C3%A8n+%26+co");
  });
});

describe("hasActiveFilters", () => {
  it("is true when any search or filter is set", () => {
    expect(hasActiveFilters({ q: "", category: "", minPrice: "", maxPrice: "" })).toBe(false);
    expect(hasActiveFilters({ q: "", category: CAT, minPrice: "", maxPrice: "" })).toBe(true);
    expect(hasActiveFilters({ q: "", category: "", minPrice: "-1", maxPrice: "" })).toBe(true);
  });
});
