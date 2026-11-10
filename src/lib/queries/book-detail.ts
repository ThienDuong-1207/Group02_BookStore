import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "@/lib/books/ids";

/** Everything the customer detail page shows (US-02 M1). */
export type BookDetail = {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  cover_url: string | null;
  author_name: string;
  category_id: string;
  category_name: string;
};

const COLUMNS = "id, title, description, price, stock, cover_url, author_name, category_id, category_name";

/**
 * One book for `/books/[id]`, or null when there is nothing to show.
 * Read from `books_public`, the same view as the list, so a soft-deleted book (US-16) or a book whose category or
 * author is hidden (US-17/18) is never shown – the page answers "not found" instead (US-22 E1).
 * A malformed id is answered without a query, so PostgreSQL never sees it.
 */
export async function getPublicBook(supabase: SupabaseClient, id: string): Promise<BookDetail | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await supabase.from("books_public").select(COLUMNS).eq("id", id).maybeSingle<BookDetail>();
  if (error) throw error;
  return data ?? null;
}
