import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { detailHref } from "@/lib/books/list-href";
import type { EffectivePrice } from "@/lib/promotions/price";
import type { BookListItem } from "@/lib/queries/book-list";
import { BookCover } from "./BookCover";

export type BookCardBook = Pick<BookListItem, "id" | "title" | "author_name" | "price" | "cover_url"> & {
  /** Today's price with any active promotion (US-27). Without it the card shows `price`. */
  pricing?: EffectivePrice;
  /** Copies in stock (US-06). 0 → "Sold Out" badge. Unknown (undefined) → no badge. */
  stock?: number;
};

/**
 * Book card on the customer list (US-19, style guide §4 "Book card").
 * M1: cover, title, author, price ("120.000 ₫"). M3: the whole card opens `/books/[id]`.
 * E1: placeholder cover; long titles are cut to 2 lines with "…" (the full title stays in the link's name).
 * US-27: during an active promotion the price shows as original struck through + discounted price + "-x%".
 * US-22: `listHref` is the list page this card is shown on; the detail link carries it so "Back to list"
 * returns to the same page with the same search / filters.
 * US-06 M2 / B1: a book with stock = 0 shows a "Sold Out" badge on its cover (style guide §4 "Badges");
 * it disappears as soon as the admin sets the stock back to 1 or more.
 */
export function BookCard({ book, listHref }: { book: BookCardBook; listHref?: string }) {
  const soldOut = book.stock === 0;
  return (
    <Link
      href={detailHref(book.id, listHref)}
      className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-3 transition-shadow hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative">
        <BookCover src={book.cover_url} title={book.title} />
        {soldOut && (
          <span className="absolute top-2 left-2 rounded-full bg-danger-surface px-2 py-0.5 text-xs font-semibold text-danger shadow-sm">
            Sold Out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h2 title={book.title} className="line-clamp-2 font-serif text-base leading-snug font-semibold break-words group-hover:text-brand">
          {book.title}
        </h2>
        <p className="truncate text-sm text-muted">{book.author_name}</p>
        <CardPrice price={book.price} pricing={book.pricing} />
      </div>
    </Link>
  );
}

/**
 * US-27 (CR-02 AC3): "150.000 ₫" struck through, "120.000 ₫" in the accent colour and a "-20%" label
 * (style guide §4 "Promotion price"). AC2: without an active promotion only the original price is shown.
 * Screen readers hear "Original price … Sale price …" instead of two bare numbers.
 */
function CardPrice({ price, pricing }: { price: number; pricing?: EffectivePrice }) {
  if (!pricing || pricing.discountPercent === null) {
    return <p className="mt-auto pt-1 font-semibold">{formatPrice(pricing?.price ?? price)}</p>;
  }
  return (
    <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
      <span className="sr-only">Original price </span>
      <del className="text-sm text-muted">{formatPrice(pricing.originalPrice)}</del>
      <span className="sr-only">Sale price </span>
      <span className="font-semibold text-accent">{formatPrice(pricing.price)}</span>
      <span className="rounded-full bg-accent-surface px-2 py-0.5 text-xs font-semibold text-accent">-{pricing.discountPercent}%</span>
    </p>
  );
}
