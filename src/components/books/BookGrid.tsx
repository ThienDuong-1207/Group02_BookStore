import { BookCard, type BookCardBook } from "./BookCard";

/**
 * "New books" grid on the home page / book list (US-19 (2/2), wireframe docs/design/wireframe-home-desktop.svg).
 * AC4: 1 column on phones (375 px), 2 from 768 px, 4 from 1024 px (1366 px) – no horizontal scrolling.
 * The order is the one the query returns: newest first (M2). E2: no books → "No books available yet."
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
    <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
      {books.map((book) => (
        <li key={book.id} className="min-w-0">
          <BookCard book={book} listHref={listHref} />
        </li>
      ))}
    </ul>
  );
}
