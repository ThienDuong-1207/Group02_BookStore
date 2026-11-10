import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BookFilters } from "@/components/books/BookFilters";
import { NoResults } from "@/components/books/NoResults";

/** US-01 (GB-6) M1, M2, AC2: the search bar on the list page and the "No results found" message. */

describe("BookFilters search bar", () => {
  it("M1: is a GET form to /books with a q field limited to 100 characters", () => {
    const html = renderToStaticMarkup(BookFilters({ q: "" }));
    expect(html).toContain('action="/books"');
    expect(html).toContain('method="get"');
    expect(html).toContain('role="search"');
    expect(html).toContain('name="q"');
    expect(html).toContain('maxLength="100"');
    expect(html).toContain(">Search</button>");
  });

  it("M2: shows the current keyword", () => {
    const html = renderToStaticMarkup(BookFilters({ q: "nguyen" }));
    expect(html).toContain('value="nguyen"');
  });

  it("does not send a page number, so a new search starts on page 1", () => {
    const html = renderToStaticMarkup(BookFilters({ q: "x" }));
    expect(html).not.toContain('name="page"');
  });
});

describe("NoResults", () => {
  it('AC2: shows "No results found", the keyword (escaped) and a Clear search link', () => {
    const html = renderToStaticMarkup(NoResults({ q: "xyz<123>", clearHref: "/books" }));
    expect(html).toContain("No results found");
    expect(html).toContain("xyz&lt;123&gt;");
    expect(html).toContain('href="/books"');
    expect(html).toContain("Clear search");
  });
});
