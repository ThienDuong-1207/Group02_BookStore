import type { SupabaseClient } from "@supabase/supabase-js";
import { effectivePrice, type EffectivePrice } from "@/lib/promotions/price";
import type { BookListItem } from "@/lib/queries/book-list";
import type { PromotionRow } from "@/lib/queries/promotions";

export type OnSaleBook = BookListItem & { pricing: EffectivePrice };

const BOOK_COLUMNS = "id, title, price, stock, cover_url, author_name, category_name, created_at";

/**
 * Home page "On sale today": books whose promotion is active today (start and end day included, CR-02),
 * biggest discount first, at most `limit` books.
 *
 * Two small queries: (1) the active promotions, (2) those books from `books_public` – the view hides
 * soft-deleted books and hidden authors / categories, so a promotion on a hidden book never shows.
 * A few extra promotions are read in step 1 because some of their books may be hidden.
 * Prices come from the same US-26 service as the list and detail pages.
 */
export async function listOnSaleBooks(supabase: SupabaseClient, today: string, limit = 4): Promise<OnSaleBook[]> {
  const { data: promotionRows, error: promotionError } = await supabase
    .from("promotions")
    .select("book_id, discount_percent, start_date, end_date")
    .lte("start_date", today)
    .gte("end_date", today)
    .order("discount_percent", { ascending: false })
    .limit(limit * 3);
  if (promotionError) throw promotionError;
  const promotions = (promotionRows ?? []) as PromotionRow[];
  if (promotions.length === 0) return [];

  const { data: bookRows, error: bookError } = await supabase
    .from("books_public")
    .select(BOOK_COLUMNS)
    .in(
      "id",
      promotions.map((promotion) => promotion.book_id),
    );
  if (bookError) throw bookError;
  const books = new Map(((bookRows ?? []) as BookListItem[]).map((book) => [book.id, book]));

  // Keep the promotion order (biggest discount first) and drop promotions whose book is not visible.
  const onSale: OnSaleBook[] = [];
  for (const promotion of promotions) {
    const book = books.get(promotion.book_id);
    if (book) onSale.push({ ...book, pricing: effectivePrice(book.price, promotion, today) });
    if (onSale.length === limit) break;
  }
  return onSale;
}
