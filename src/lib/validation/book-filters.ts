import { cleanKeyword } from "@/lib/books/search";
import { isUuid } from "@/lib/books/ids";
import { MAX_PRICE, wholeNumber } from "./books";

/**
 * US-01 / US-09 (GB-14): reads the list filters from the URL (`?q=&category=&minPrice=&maxPrice=`).
 * The same functions run in the filter form (client, before the URL changes) and on the server (the page reads
 * the URL), so a hand-typed URL is checked exactly like the form (PROJECT_SPEC NFR-4).
 */

export const FILTER_MESSAGES = {
  minPrice: "Minimum price must be a whole number of 0 or more",
  maxPrice: "Maximum price must be a whole number of 0 or more",
  range: "Minimum price cannot be greater than maximum price",
} as const;

export type FilterErrors = Partial<Record<keyof typeof FILTER_MESSAGES, string>>;

/** The raw text of each field, to put back into the form (an invalid price is shown as typed). */
export type FilterValues = { q: string; category: string; minPrice: string; maxPrice: string };

/** What the list query applies. A missing key means "no condition". */
export type ListFilters = { q?: string; categoryId?: string; minPrice?: number; maxPrice?: number };

type Raw = string | string[] | undefined;
const first = (raw: Raw) => (Array.isArray(raw) ? raw[0] : raw) ?? "";

// E2: a price is a whole number of VND ≥ 0 ("0" is allowed: "from 0"). "-5", "1.5" and "abc" are rejected.
const minPriceSchema = wholeNumber({ min: 0, max: MAX_PRICE, required: FILTER_MESSAGES.minPrice, invalid: FILTER_MESSAGES.minPrice });
const maxPriceSchema = wholeNumber({ min: 0, max: MAX_PRICE, required: FILTER_MESSAGES.maxPrice, invalid: FILTER_MESSAGES.maxPrice });

/**
 * US-09 price range. B2: only min or only max is fine (open-ended). B1: the range is inclusive.
 * E1 (AC3): min > max → error. E2: invalid number → error. With any error the price filter is NOT applied.
 */
export function parsePriceRange(minRaw: string, maxRaw: string): { minPrice?: number; maxPrice?: number; errors: FilterErrors } {
  const errors: FilterErrors = {};
  const min = minRaw.trim() ? minPriceSchema.safeParse(minRaw) : null;
  const max = maxRaw.trim() ? maxPriceSchema.safeParse(maxRaw) : null;
  if (min && !min.success) errors.minPrice = FILTER_MESSAGES.minPrice;
  if (max && !max.success) errors.maxPrice = FILTER_MESSAGES.maxPrice;

  const minPrice = min?.success ? min.data : undefined;
  const maxPrice = max?.success ? max.data : undefined;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) errors.range = FILTER_MESSAGES.range;

  if (Object.keys(errors).length > 0) return { errors };
  return { minPrice, maxPrice, errors };
}

/**
 * Everything the list page needs from its query parameters.
 * A category that is not a well-formed id is ignored (the menu and the form only ever send real ids).
 */
export function parseListParams(params: Record<string, Raw>): { values: FilterValues; filters: ListFilters; errors: FilterErrors } {
  const q = cleanKeyword(params.q);
  const category = first(params.category).trim();
  const categoryId = isUuid(category) ? category : undefined;
  const minPrice = first(params.minPrice).trim();
  const maxPrice = first(params.maxPrice).trim();
  const price = parsePriceRange(minPrice, maxPrice);

  const filters: ListFilters = {};
  if (q) filters.q = q;
  if (categoryId) filters.categoryId = categoryId;
  if (price.minPrice !== undefined) filters.minPrice = price.minPrice;
  if (price.maxPrice !== undefined) filters.maxPrice = price.maxPrice;

  return { values: { q, category: categoryId ?? "", minPrice, maxPrice }, filters, errors: price.errors };
}

/** True when a search or a filter is active (heading, "No results found", "Clear filters"). */
export function hasActiveFilters(values: FilterValues): boolean {
  return Boolean(values.q || values.category || values.minPrice || values.maxPrice);
}

/**
 * The `/books` URL for some filter values: empty fields are left out and `page` is never kept, so changing a
 * search or a filter always starts again on page 1 (US-25 M2).
 */
export function filtersHref(values: Partial<FilterValues>): string {
  const query = new URLSearchParams();
  const q = cleanKeyword(values.q);
  if (q) query.set("q", q);
  for (const key of ["category", "minPrice", "maxPrice"] as const) {
    const value = values[key]?.trim();
    if (value) query.set(key, value);
  }
  const search = query.toString();
  return search ? `/books?${search}` : "/books";
}
