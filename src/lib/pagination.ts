/**
 * US-20 pagination helpers (pure, so they are easy to test).
 * The list shows exactly 12 books per page (fewer on the last page); the page number lives in the URL (?page=3).
 */

export const PAGE_SIZE = 12;

/** E1: "?page=0", negative, decimal, non-numeric or missing → page 1. */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d+$/.test(value.trim())) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/** Rows to ask the database for: page 1 → 0..11, page 2 → 12..23 (B2: `.range(from, to)`, inclusive). */
export function pageRange(page: number, pageSize = PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/** 30 books → 3 pages. 0 books → 1 page (an empty first page). */
export function totalPages(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Page numbers to show between Prev and Next. All of them up to 7 pages; otherwise the first, the last and the
 * neighbours of the current page with "…" gaps, e.g. page 6 of 12 → 1 … 5 6 7 … 12.
 */
export function pageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const items: (number | "…")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) items.push("…");
    items.push(page);
  });
  return items;
}

/**
 * Link to another page of the same list. Every other query parameter (q, category, minPrice, maxPrice from
 * US-01 / US-09) is kept, so search and filters survive page changes (US-25). Page 1 drops `page` from the URL.
 */
export function pageHref(pathname: string, params: Record<string, string | string[] | undefined>, page: number): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
}
