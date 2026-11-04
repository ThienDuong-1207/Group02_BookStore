import type { SupabaseClient } from "@supabase/supabase-js";

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
  if (error) throw error;

  const rows = ((data ?? []) as unknown as AdminBookQueryRow[]).map(({ authors, categories, ...book }) => ({
    ...book,
    author_name: authors?.name ?? "—",
    category_name: categories?.name ?? "—",
  }));
  return { rows, total: count ?? 0 };
}
