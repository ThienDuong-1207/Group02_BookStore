import Link from "next/link";
import { formatDate } from "@/lib/queries/users";
import { formatPrice } from "@/lib/format";
import type { AdminBookRow } from "@/lib/queries/books";

/**
 * Admin book list – cards on phones, a table from 768 px up (no sideways scrolling at 375 px).
 * `actions` renders the buttons of one row: Edit (US-15), Promotion (US-26), Delete (US-16).
 */
export function BookList({ books, actions }: { books: AdminBookRow[]; actions?: (book: AdminBookRow) => React.ReactNode }) {
  if (books.length === 0) {
    return <p className="mt-6 rounded-lg border border-dashed border-line bg-surface p-5 text-sm text-muted">No books yet.</p>;
  }
  return (
    <>
      <ul className="mt-6 flex flex-col gap-3 md:hidden">
        {books.map((book) => (
          <li key={book.id} className="rounded-lg border border-line bg-surface p-4">
            <p className="font-medium break-words">{book.title}</p>
            <p className="text-sm text-muted">
              {book.author_name} · {book.category_name}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>{formatPrice(book.price)}</span>
              <span className="text-muted">Stock {book.stock}</span>
              <span className="text-muted">Added {formatDate(book.created_at)}</span>
            </div>
            {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{actions(book)}</div>}
          </li>
        ))}
      </ul>

      <div className="mt-6 hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-background text-xs tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Title</th>
              <th scope="col" className="px-4 py-3 font-medium">Author</th>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Price</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Stock</th>
              <th scope="col" className="px-4 py-3 font-medium">Added</th>
              {actions && (
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium break-words">{book.title}</td>
                <td className="px-4 py-3 text-muted">{book.author_name}</td>
                <td className="px-4 py-3 text-muted">{book.category_name}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatPrice(book.price)}</td>
                <td className="px-4 py-3 text-right">{book.stock}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(book.created_at)}</td>
                {actions && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">{actions(book)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Simple Previous / Next links for the admin list (the customer list has full page numbers, US-20). */
export function AdminPager({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const linkClass =
    "inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium hover:border-brand focus-visible:outline-2 focus-visible:outline-brand";
  return (
    <nav aria-label="Book list pages" className="mt-4 flex items-center justify-between gap-2">
      {page > 1 ? (
        <Link href={`/admin/books?page=${page - 1}`} className={linkClass}>
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`/admin/books?page=${page + 1}`} className={linkClass}>
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
