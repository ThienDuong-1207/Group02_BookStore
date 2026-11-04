import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_PAGE_SIZE, listAdminBooks } from "@/lib/queries/books";
import { AdminPager, BookList } from "@/components/admin/BookList";

export const metadata: Metadata = { title: "Books – Admin – Book Store" };

/** Admin book list, newest first, with an "Add book" button (US-05) Edit per row (US-15) and Promotion per row (US-26). Access: admin layout + RLS. */
export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const requested = Number.parseInt((await searchParams).page ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;

  const supabase = await createClient();
  const { rows, total } = await listAdminBooks(supabase, page);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Books</h1>
          <p className="text-sm text-muted">
            {total} {total === 1 ? "book" : "books"}
          </p>
        </div>
        <Link
          href="/admin/books/new"
          className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Add book
        </Link>
      </div>

      <BookList
        books={rows}
        actions={(book) => (
          <>
            <Link
              href={`/admin/books/${book.id}/edit`}
              aria-label={`Edit ${book.title}`}
              className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm font-medium hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              Edit
            </Link>
            <Link
              href={`/admin/books/${book.id}/promotion`}
              aria-label={`Promotion for ${book.title}`}
              className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm font-medium hover:border-brand focus-visible:outline-2 focus-visible:outline-brand"
            >
              Promotion
            </Link>
          </>
        )}
      />
      <AdminPager page={Math.min(page, totalPages)} totalPages={totalPages} />
    </>
  );
}
