import type { SupabaseClient } from "@supabase/supabase-js";

export type CategoryLink = { id: string; name: string };

/**
 * Visible categories for the header menu (US-29 AC1), A → Z.
 * Hidden categories are filtered here and by RLS ("categories: public read visible") for guests and customers.
 * The menu is not essential, so on a database error the header simply shows no categories instead of failing the page.
 */
export async function listMenuCategories(supabase: SupabaseClient): Promise<CategoryLink[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_hidden", false)
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as CategoryLink[];
}

/** Link used by the category menu; the list page reads the filter from the URL (PROJECT_SPEC §6, US-09). */
export function categoryHref(categoryId: string): string {
  return `/books?category=${encodeURIComponent(categoryId)}`;
}
