import type { SupabaseClient } from "@supabase/supabase-js";
import type { Promotion } from "@/lib/promotions/price";

export type PromotionRow = Promotion & { book_id: string };

const COLUMNS = "book_id, discount_percent, start_date, end_date";

/** The promotion of one book, or null. */
export async function getPromotion(supabase: SupabaseClient, bookId: string): Promise<PromotionRow | null> {
  const { data, error } = await supabase.from("promotions").select(COLUMNS).eq("book_id", bookId).maybeSingle<PromotionRow>();
  if (error) throw error;
  return data ?? null;
}

/**
 * Promotions of the books shown on one list page, by book id (for US-27: one query per page, not one per card).
 * Combine with `effectivePrice()` from `@/lib/promotions/price`.
 */
export async function getPromotionsForBooks(supabase: SupabaseClient, bookIds: string[]): Promise<Map<string, PromotionRow>> {
  if (bookIds.length === 0) return new Map();
  const { data, error } = await supabase.from("promotions").select(COLUMNS).in("book_id", bookIds);
  if (error) throw error;
  return new Map(((data ?? []) as PromotionRow[]).map((row) => [row.book_id, row]));
}
