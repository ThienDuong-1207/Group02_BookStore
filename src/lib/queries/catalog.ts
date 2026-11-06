import type { SupabaseClient } from "@supabase/supabase-js";
import { CATALOG, type CatalogKind } from "@/lib/validation/catalog";

/** One category or author on its admin page. */
export type CatalogItem = { id: string; name: string; is_hidden: boolean };

/**
 * Every category / author, hidden ones included, A → Z (US-17, US-18 M1).
 * Only admins get hidden rows back: RLS "…: public read visible" lets them read everything.
 */
export async function listCatalogItems(supabase: SupabaseClient, kind: CatalogKind): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from(CATALOG[kind].table)
    .select("id, name, is_hidden")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CatalogItem[];
}
