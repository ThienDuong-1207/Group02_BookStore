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
 * US-06 AC1 / AC3: stock 0 → a "Sold Out" label on the cover; as soon as stock is 1 or more it is gone.
 */
export function BookCard({ book, listHref }: { book: BookCardBook; listHref?: string }) {
  return (
    <Link
      href={detailHref(book.id, listHref)}
      className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-3 transition-shadow hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="relative">
        <BookCover src={book.cover_url} title={book.title} />
        {book.stock === 0 && <SoldOutBadge className="absolute top-2 left-2 shadow-sm" />}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h2 title={book.title} className="line-clamp-2 font-serif text-base leading-snug font-semibold break-words group-hover:text-brand">
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
