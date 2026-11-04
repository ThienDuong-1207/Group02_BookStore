import type { SupabaseClient } from "@supabase/supabase-js";
import { pageRange } from "@/lib/pagination";

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

const COLUMNS = "id, title, price, stock, cover_url, author_name, category_name, created_at";

/**
 * US-20: one page of the customer list, newest first.
 * B2: paginated IN THE DATABASE – `.range()` fetches only the 12 rows of this page and `count: "exact"` returns
 * the total for the page controls; all books are never loaded.
 * `books_public` already hides soft-deleted books and hidden authors/categories (US-19 B1).
 * Order `created_at desc, id desc` keeps pages stable even when two books share a timestamp.
 */
export async function listPublicBooks(
  supabase: SupabaseClient,
  page: number,
): Promise<{ books: BookListItem[]; total: number }> {
  const { from, to } = pageRange(page);
  const { data, error, count } = await supabase
    .from("books_public")
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);
  if (!error) return { books: (data ?? []) as BookListItem[], total: count ?? 0 };

  // A page past the end makes PostgREST answer "range not satisfiable" (PGRST103) without a count.
  // Ask for the count alone, so the page can send the visitor to the last page (E1).
  if (error.code !== "PGRST103") throw error;
  const head = await supabase.from("books_public").select("id", { count: "exact", head: true });
  if (head.error) throw head.error;
  return { books: [], total: head.count ?? 0 };
}
