import { effectivePrice, type EffectivePrice, type Promotion } from "@/lib/promotions/price";

/**
 * US-27 (CR-02 AC3): the price each card of one list page shows, using the US-26 price service so the list,
 * the detail page (US-28) and the admin preview always agree.
 * AC2: no promotion, one that has not started yet or one that has ended → only the original price.
 */
export function withEffectivePrices<T extends { id: string; price: number }>(
  books: T[],
  promotions: ReadonlyMap<string, Promotion>,
  today: string,
): (T & { pricing: EffectivePrice })[] {
  return books.map((book) => ({ ...book, pricing: effectivePrice(book.price, promotions.get(book.id), today) }));
}
