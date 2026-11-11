import Link from "next/link";
import { formatDate } from "@/lib/queries/users";
import { formatPrice } from "@/lib/format";
import type { AdminBookRow } from "@/lib/queries/books";
import { SoldOutBadge } from "@/components/books/SoldOutBadge";

/**
 * Admin book list – cards below 1024 px (1 column on phones, 2 on tablets), a table from 1024 px up.
 * US-21 AC3 / DEF-07: at 768 px the 7-column table + 3 buttons did not fit and was cut off, so tablets get cards;
 * the table box scrolls inside itself (`overflow-x-auto`) instead of clipping if a row is ever too wide.
 * `actions` renders the buttons of one row: Edit (US-15), Promotion (US-26), Delete (US-16).
 * US-06 M1: the stock of every book is listed, with a "Sold Out" label at 0 (stock is changed in Edit).
 */
export function BookList({ books, actions }: { books: AdminBookRow[]; actions?: (book: AdminBookRow) => React.ReactNode }) {
  if (books.length === 0) {
    return <p className="mt-6 rounded-lg border border-dashed border-line bg-surface p-5 text-sm text-muted">No books yet.</p>;
  }
  return (
    <>
      <ul className="mt-6 grid gap-3 md:grid-cols-2 lg:hidden">
        {books.map((book) => (
          <li key={book.id} className="rounded-lg border border-line bg-surface p-4">
            <p className="font-medium break-words">{book.title}</p>
            <p className="text-sm text-muted">
              {book.author_name} · {book.category_name}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span>{formatPrice(book.price)}</span>
              <span className="inline-flex items-center gap-2 text-muted">
                Stock {book.stock}
                {book.stock === 0 && <SoldOutBadge />}
              </span>
              <span className="text-muted">Added {formatDate(book.created_at)}</span>
            </div>
            {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{actions(book)}</div>}
          </li>
        ))}
      </ul>

      <div className="relative mt-6 hidden overflow-x-auto rounded-lg border border-line bg-surface lg:block">
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
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {/* US-06: the admin sees at a glance which books customers see as Sold Out */}
                  {book.stock === 0 ? <SoldOutBadge className="mr-2" /> : null}
                  {book.stock}
                </td>
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
