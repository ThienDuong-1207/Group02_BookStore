import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * US-22 E1 (GB-49): an unknown, malformed or soft-deleted book id must answer HTTP 404.
 * A route-level loading.tsx makes Next.js stream the page and send "200 OK" before notFound() runs (a soft 404).
 * The list's loading UI therefore lives in the `(list)` route group, which does not contain `[id]`.
 */
const books = fileURLToPath(new URL("../../src/app/(public)/books/", import.meta.url));

describe("book detail route keeps a real 404 (US-22 E1)", () => {
  it("has no loading.tsx that wraps /books/[id]", () => {
    expect(existsSync(`${books}loading.tsx`)).toBe(false);
    expect(existsSync(`${books}[id]/loading.tsx`)).toBe(false);
  });

  it("keeps the list page and its loading UI together in the (list) group", () => {
    expect(existsSync(`${books}(list)/page.tsx`)).toBe(true);
    expect(existsSync(`${books}(list)/loading.tsx`)).toBe(true);
    expect(existsSync(`${books}page.tsx`)).toBe(false);
  });

  it("keeps the friendly not-found page next to the detail page", () => {
    expect(existsSync(`${books}[id]/page.tsx`)).toBe(true);
    expect(existsSync(`${books}[id]/not-found.tsx`)).toBe(true);
  });
});
