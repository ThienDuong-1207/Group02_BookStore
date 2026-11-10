import type { SupabaseClient } from "@supabase/supabase-js";
import { pageRange } from "@/lib/pagination";
import { searchPattern } from "@/lib/books/search";
import type { ListFilters } from "@/lib/validation/book-filters";

/** One book on the customer list (F3). Read from the `books_public` view only. */
export type BookListItem = {
  id: string;
  title: string;
  price: number;
  stock: number;
  cover_url: string | null;
  author_name: string;
  category_name: string;
  created_at: string;
};

/** Search (US-01) and filters (US-09) of the list, already validated by `parseListParams`. Empty = the full list. */
export type BookListFilters = ListFilters;

const COLUMNS = "id, title, price, stock, cover_url, author_name, category_name, created_at";

/** The filter methods we use. Every supabase-js filter returns the same builder, so the result keeps its type. */
type FilterBuilder = {
  ilike(column: string, pattern: string): FilterBuilder;
  eq(column: string, value: string): FilterBuilder;
  gte(column: string, value: number): FilterBuilder;
  lte(column: string, value: number): FilterBuilder;
};

/**
 * Adds the WHERE conditions of the filters to a `books_public` query. Used for the page AND for the count-only
 * fallback, so both always count the same rows. All conditions are combined with AND (US-25 B2).
 * US-01 AC1: `search_text` holds "title⏎author", lower case without marks, so one `ilike` finds a keyword in either.
 * US-09 AC1: one category. AC2 (CR-02): the price range uses the ORIGINAL price (`price` column), not the
 * promotional price, and is inclusive (B1: min = max = 120000 keeps books priced exactly 120,000).
 */
function applyFilters<Query>(query: Query, filters: BookListFilters): Query {
  // Typed through the small FilterBuilder shape: supabase-js's own generic types are too deep for `tsc` here.
  let filtered = query as unknown as FilterBuilder;
  const pattern = searchPattern(filters.q ?? "");
  if (pattern) filtered = filtered.ilike("search_text", pattern);
  if (filters.categoryId) filtered = filtered.eq("category_id", filters.categoryId);
  if (filters.minPrice !== undefined) filtered = filtered.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) filtered = filtered.lte("price", filters.maxPrice);
  return filtered as unknown as Query;
}

/**
 * US-20: one page of the customer list, newest first; US-01 / US-09: only the books that match.
 * B2: paginated IN THE DATABASE – `.range()` fetches only the 12 rows of this page and `count: "exact"` returns
 * the total (of the matching books) for the page controls; all books are never loaded.
 * `books_public` already hides soft-deleted books and hidden authors/categories (US-19 B1).
 * Order `created_at desc, id desc` keeps pages stable even when two books share a timestamp.
 */
export async function listPublicBooks(
  supabase: SupabaseClient,
  page: number,
  filters: BookListFilters = {},
): Promise<{ books: BookListItem[]; total: number }> {
  const { from, to } = pageRange(page);
  const { data, error, count } = await applyFilters(supabase.from("books_public").select(COLUMNS, { count: "exact" }), filters)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (!error) return { books: (data ?? []) as BookListItem[], total: count ?? 0 };

  // A page past the end makes PostgREST answer "range not satisfiable" (PGRST103) without a count.
  // Ask for the count alone, so the page can send the visitor to the last page (E1).
  if (error.code !== "PGRST103") throw error;
  const head = await applyFilters(supabase.from("books_public").select("id", { count: "exact", head: true }), filters);
  if (head.error) throw head.error;
  return { books: [], total: head.count ?? 0 };
}
