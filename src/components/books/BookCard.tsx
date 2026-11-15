import Link from "next/link";
import { detailHref } from "@/lib/books/list-href";
import type { EffectivePrice } from "@/lib/promotions/price";
import type { BookListItem } from "@/lib/queries/book-list";
import { BookCover } from "./BookCover";
import { PriceTag } from "./PriceTag";
import { SoldOutBadge } from "./SoldOutBadge";

export type BookCardBook = Pick<BookListItem, "id" | "title" | "author_name" | "price" | "cover_url"> & {
  /** Copies in stock (US-06). 0 → "Sold Out" label on the cover. Omitted → no label. */
  stock?: number;
  /** Today's price with any active promotion (US-27). Without it the card shows `price`. */
  pricing?: EffectivePrice;
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
 * Look and motion (style guide §4, §6): no box around the card – the cover is the object. On hover the cover
 * lifts and tilts slightly and its shadow deepens. `data-cover-transition` lets CoverTransition fly the cover to
 * the detail page. A discount also shows as a small tag on the cover corner (hidden from screen readers, which
 * already hear it in the price line).
 */
export function BookCard({ book, listHref }: { book: BookCardBook; listHref?: string }) {
  const soldOut = book.stock === 0;
  const discount = book.pricing?.discountPercent ?? null;
  return (
    <Link
      href={detailHref(book.id, listHref)}
      data-cover-transition
      className="group flex h-full flex-col gap-4 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
    >
      <div className="relative transition-transform duration-500 ease-[var(--ease-book)] group-hover:-translate-y-2 group-hover:-rotate-1 group-focus-visible:-translate-y-2">
        <BookCover src={book.cover_url} title={book.title} />
        {discount !== null && (
          <span aria-hidden="true" className="absolute top-3 -right-1.5 rounded-l-sm rounded-tr-sm bg-accent px-2 py-0.5 text-xs font-semibold text-white shadow-md">
            -{discount}%
          </span>
        )}
        {soldOut && <SoldOutBadge className="absolute top-2 left-2 shadow-sm" />}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h2 title={book.title} className="line-clamp-2 font-serif text-lg leading-snug font-semibold break-words transition-colors group-hover:text-brand">
          {book.title}
        </h2>
        <p className="truncate text-sm text-muted">{book.author_name}</p>
        <p className="mt-auto pt-1">
          <PriceTag price={book.price} pricing={book.pricing} />
        </p>
      </div>
    </Link>
  );
}
