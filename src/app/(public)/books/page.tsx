import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { listPublicBooks } from "@/lib/queries/book-list";
import { PAGE_SIZE, pageHref, parsePage, totalPages } from "@/lib/pagination";
import { Pagination } from "@/components/books/Pagination";

export const metadata: Metadata = { title: "Books – Book Store" };

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Customer book list, 12 per page, newest first (US-20).
 * The simple cards below are a placeholder: the real card grid (cover, placeholder image, 2-line titles,
 * responsive columns) is US-19 (Đan) and replaces <BookTile>. Search / filters come in US-01, US-09, US-25.
 */
export default async function BooksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page); // E1: 0, negative, non-numeric → 1

  const supabase = await createClient();
  const { books, total } = await listPublicBooks(supabase, page);
  const lastPage = totalPages(total);

  // E1: a page past the end → the last page (keeps the other query parameters).
  if (total > 0 && page > lastPage) redirect(pageHref("/books", params, lastPage));

  const first = (page - 1) * PAGE_SIZE + 1;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Books</h1>
        {total > 0 && (
          <p className="text-sm text-muted">
            Showing {first}–{first + books.length - 1} of {total} · Page {page} of {lastPage}
          </p>
        )}
      </div>

      {books.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line bg-surface p-8 text-center text-muted">
          No books available yet.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <li key={book.id}>
              <BookTile book={book} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={lastPage} pathname="/books" params={params} />
    </main>
  );
}

/** Placeholder card until US-19 is merged: title, author and price only. */
function BookTile({ book }: { book: Awaited<ReturnType<typeof listPublicBooks>>["books"][number] }) {
  return (
    <Link
      href={`/books/${book.id}`}
      className="flex h-full flex-col gap-1 rounded-lg border border-line bg-surface p-4 hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      <span className="line-clamp-2 font-medium">{book.title}</span>
      <span className="text-sm text-muted">{book.author_name}</span>
      <span className="mt-auto pt-2 font-semibold">{formatPrice(book.price)}</span>
    </Link>
  );
}
