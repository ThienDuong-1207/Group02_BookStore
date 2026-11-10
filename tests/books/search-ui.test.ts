import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * US-01 (GB-6) M1, M2, AC2 and US-09 (GB-14) M1, AC3, AC4: the search + filter form on the list page and the
 * "No results found" message. The client form renders in its first (server) state.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const { BookFilters } = await import("@/components/books/BookFilters");
const { NoResults } = await import("@/components/books/NoResults");

const CAT = "3f1c2a8e-9b7d-4e6f-8a5b-1c2d3e4f5a6b";
const empty = { q: "", category: "", minPrice: "", maxPrice: "" };
const categories = [
  { id: CAT, name: "Văn học" },
  { id: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d", name: "Kinh tế" },
];
const render = (props: Partial<Parameters<typeof BookFilters>[0]> = {}) =>
  renderToStaticMarkup(createElement(BookFilters, { values: empty, errors: {}, categories, ...props }));

describe("BookFilters search bar (US-01)", () => {
  it("M1: is a GET search form to /books with a q field limited to 100 characters", () => {
    const html = render();
    expect(html).toContain('action="/books"');
    expect(html).toContain('method="get"');
    expect(html).toContain('role="search"');
    expect(html).toContain('name="q"');
    expect(html).toContain('maxLength="100"');
  });

  it("M2: shows the current keyword", () => {
    expect(render({ values: { ...empty, q: "nguyen" } })).toContain('value="nguyen"');
  });

  it("does not send a page number, so new conditions start on page 1", () => {
    expect(render()).not.toContain('name="page"');
  });
});

describe("BookFilters filter panel (US-09)", () => {
  it("M1: category selector with visible categories + min/max price inputs", () => {
    const html = render();
    expect(html).toContain('name="category"');
    expect(html).toContain("All categories");
    expect(html).toContain(`value="${CAT}"`);
    expect(html).toContain("Văn học");
    expect(html).toContain('name="minPrice"');
    expect(html).toContain('name="maxPrice"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain(">Apply</button>");
  });

  it("B3: puts the URL values back into the fields", () => {
    const html = render({ values: { q: "", category: CAT, minPrice: "90000", maxPrice: "110000" } });
    expect(html).toMatch(new RegExp(`<option value="${CAT}" selected="">`));
    expect(html).toContain('value="90000"');
    expect(html).toContain('value="110000"');
  });

  it("AC3: shows the range error next to the max price", () => {
    const html = render({
      values: { ...empty, minPrice: "200000", maxPrice: "100000" },
      errors: { range: "Minimum price cannot be greater than maximum price" },
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain("Minimum price cannot be greater than maximum price");
    expect(html).toContain('aria-invalid="true"');
  });

  it("E2: shows the invalid-number message", () => {
    const html = render({ values: { ...empty, minPrice: "-5" }, errors: { minPrice: "Minimum price must be a whole number of 0 or more" } });
    expect(html).toContain("Minimum price must be a whole number of 0 or more");
  });

  it("AC4: Clear filters (→ /books) appears only while something is filtered", () => {
    expect(render()).not.toContain("Clear filters");
    const html = render({ values: { ...empty, category: CAT } });
    expect(html).toContain("Clear filters");
    expect(html).toContain('href="/books"');
  });

  it("only shows the categories it is given (hidden ones are never passed)", () => {
    expect(render({ categories: [] })).not.toContain("Văn học");
  });
});

describe("BookFilters on phones (US-21 / GB-48)", () => {
  it("M2: category + price fold behind a Filters button (closed on first load); search and Apply stay visible", () => {
    const html = render();
    expect(html).toMatch(/<button type="button" aria-expanded="false"[^>]*md:hidden/);
    expect(html).toContain("hidden min-w-0 gap-3 md:contents");
    // the search field and Apply are outside the folded wrapper
    expect(html.indexOf('name="q"')).toBeLessThan(html.indexOf("aria-expanded"));
    expect(html.lastIndexOf(">Apply</button>")).toBeGreaterThan(html.indexOf('name="maxPrice"'));
  });

  it("shows how many filters are active on the folded button", () => {
    const html = render({ values: { q: "", category: CAT, minPrice: "1000", maxPrice: "" } });
    expect(html).toContain("Filters<span");
    expect(html).toContain("(2)");
  });

  it("opens by itself when the URL has a price error, so the message is visible", () => {
    const html = render({ values: { ...empty, minPrice: "-5" }, errors: { minPrice: "Minimum price must be a whole number of 0 or more" } });
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain("grid min-w-0 gap-3 md:contents");
  });

  it("B1: controls are at least 44 px high and fields may shrink (no horizontal scrolling)", () => {
    const html = render();
    expect(html.match(/min-h-11/g)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(html).toContain("min-w-0");
  });
});

describe("NoResults", () => {
  it('US-01 AC2: "No results found", the keyword (escaped), Clear search and Clear filters', () => {
    const html = renderToStaticMarkup(NoResults({ q: "xyz<123>", clearSearchHref: `/books?category=${CAT}` }));
    expect(html).toContain("No results found");
    expect(html).toContain("xyz&lt;123&gt;");
    expect(html).toContain("Clear search");
    expect(html).toContain(`href="/books?category=${CAT}"`);
    expect(html).toContain("Clear filters");
  });

  it("filters only (no keyword): no Clear search link", () => {
    const html = renderToStaticMarkup(NoResults({ q: "", clearSearchHref: "/books" }));
    expect(html).toContain("No books match the current filters.");
    expect(html).not.toContain("Clear search");
  });
});
