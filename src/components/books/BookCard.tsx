import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { BookListItem } from "@/lib/queries/book-list";
import { BookCover } from "./BookCover";

export type BookCardBook = Pick<BookListItem, "id" | "title" | "author_name" | "price" | "cover_url">;

/**
 * Book card on the customer list (US-19, style guide §4 "Book card").
 * M1: cover, title, author, price ("120.000 ₫"). M3: the whole card opens `/books/[id]`.
 * E1: placeholder cover; long titles are cut to 2 lines with "…" (the full title stays in the link's name).
 */
export function BookCard({ book }: { book: BookCardBook }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex h-full flex-col gap-3 rounded-lg border border-line bg-surface p-3 transition-shadow hover:border-brand hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <BookCover src={book.cover_url} title={book.title} />
      <div className="flex flex-1 flex-col gap-1">
        <h2 title={book.title} className="line-clamp-2 font-serif text-base leading-snug font-semibold break-words group-hover:text-brand">
          {book.title}
        </h2>
        <p className="truncate text-sm text-muted">{book.author_name}</p>
        <p className="mt-auto pt-1 font-semibold">{formatPrice(book.price)}</p>
      </div>
    </Link>
  );
}
