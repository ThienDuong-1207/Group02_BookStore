import { Reveal } from "@/components/motion/Reveal";
import { BookCard, type BookCardBook } from "./BookCard";

/**
 * "New books" grid on the home page / book list (US-19 (2/2), wireframe docs/design/wireframe-home-desktop.svg).
 * AC4: 1 column on phones (375 px), 2 from 768 px, 4 from 1024 px (1366 px) – no horizontal scrolling.
 * The order is the one the query returns: newest first (M2). E2: no books → "No books available yet."
 * Motion (style guide §6): each card slides up when it scrolls into view; cards of one row start 70 ms apart.
 * `listHref`: the current list URL (page + search + filters), passed to every card for "Back to list" (US-22).
 */
export function BookGrid({ books, listHref }: { books: BookCardBook[]; listHref?: string }) {
  if (books.length === 0) {
    return (
      <p className="mt-6 rounded-lg border border-dashed border-line bg-surface p-8 text-center text-muted">
        No books available yet.
      </p>
    );
  }
  return (
    <ul className="mt-8 grid grid-cols-1 gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
      {books.map((book, index) => (
        <Reveal as="li" key={book.id} delay={(index % 4) * 70} className="mx-auto w-full max-w-72 min-w-0 md:max-w-none">
          <BookCard book={book} listHref={listHref} />
        </Reveal>
      ))}
    </ul>
  );
}
