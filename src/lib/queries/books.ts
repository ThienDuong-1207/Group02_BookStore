import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "@/lib/books/ids";

/** One author or category in the book form dropdowns. */
export type Option = { id: string; name: string };

/**
 * Visible authors and categories for the book form, A → Z.
 * Admins can read hidden rows too (RLS), so `is_hidden = false` is filtered explicitly:
 * hidden authors / categories are never offered in the form (US-17, US-18).
 */
export async function listBookOptions(supabase: SupabaseClient): Promise<{ authors: Option[]; categories: Option[] }> {
  const [authors, categories] = await Promise.all([
    supabase.from("authors").select("id, name").eq("is_hidden", false).order("name"),
    supabase.from("categories").select("id, name").eq("is_hidden", false).order("name"),
  ]);
  if (authors.error) throw authors.error;
  if (categories.error) throw categories.error;
  return { authors: (authors.data ?? []) as Option[], categories: (categories.data ?? []) as Option[] };
}

/** One row of the admin book list. */
export type AdminBookRow = {
  id: string;
  title: string;
  price: number;
  stock: number;
  created_at: string;
  author_name: string;
  category_name: string;
};

export const ADMIN_PAGE_SIZE = 20;

type AdminBookQueryRow = Omit<AdminBookRow, "author_name" | "category_name"> & {
  authors: { name: string } | null;
  categories: { name: string } | null;
};

/**
 * Books that are not deleted, newest first (same order as the customer list, so a new book is on top).
 * Paginated in the database with `.range()` – never loads every row.
 */
export async function listAdminBooks(
  supabase: SupabaseClient,
  page: number,
): Promise<{ rows: AdminBookRow[]; total: number }> {
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await supabase
    .from("books")
    .select("id, title, price, stock, created_at, authors(name), categories(name)", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) {
    // A page past the end (e.g. after deleting the last book of the last page, US-16) makes PostgREST answer
    // "range not satisfiable" (PGRST103) without rows. Ask for the count alone so the page can go to the last page.
    if (error.code !== "PGRST103") throw error;
    const head = await supabase.from("books").select("id", { count: "exact", head: true }).is("deleted_at", null);
    if (head.error) throw head.error;
    return { rows: [], total: head.count ?? 0 };
  }

  const rows = ((data ?? []) as unknown as AdminBookQueryRow[]).map(({ authors, categories, ...book }) => ({
    ...book,
    author_name: authors?.name ?? "—",
    category_name: categories?.name ?? "—",
  }));
  return { rows, total: count ?? 0 };
}

/** The editable fields of one book (US-15 M1). */
export type EditableBook = {
  id: string;
  title: string;
  author_id: string;
  category_id: string;
  price: number;
  stock: number;
  description: string;
  cover_url: string | null;
};

// Moved to a dependency-free module so the client-side filter form can use it too (US-09); re-exported here.
export { isUuid };

/**
 * One book that is not deleted, or null (US-15 E2: unknown, malformed or soft-deleted id → "Book not found").
 * A malformed id is answered without a query, so PostgreSQL never sees it.
 */
export async function getEditableBook(supabase: SupabaseClient, id: string): Promise<EditableBook | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await supabase
    .from("books")
    .select("id, title, author_id, category_id, price, stock, description, cover_url")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle<EditableBook>();
  if (error) throw error;
  return data ?? null;
}
