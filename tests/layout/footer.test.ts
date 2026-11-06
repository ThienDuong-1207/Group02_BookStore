import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/layout/Footer";

/** US-29 (GB-106) AC1 and AC4: footer content and the class that pins it to the bottom. */
describe("Footer (US-29)", () => {
  const html = renderToStaticMarkup(createElement(Footer));

  it("AC1: shows store info, contact, links and ©", () => {
    expect(html).toContain("Book Store");
    expect(html).toContain("mailto:support@bookstore.demo");
    expect(html).toContain('href="/books"');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/register"');
    expect(html).toContain("© 2026 Book Store · Team 02");
  });

  it("AC4: uses mt-auto so it stays at the bottom of short pages", () => {
    expect(html).toMatch(/<footer class="mt-auto/);
  });
});
