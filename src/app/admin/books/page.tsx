import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_PAGE_SIZE, listAdminBooks } from "@/lib/queries/books";
import { AdminPager, BookList } from "@/components/admin/BookList";
import { DeleteBookButton } from "@/components/admin/DeleteBookButton";
import { BOOK_MESSAGES } from "@/lib/admin/book-messages";

export const metadata: Metadata = { title: "Books – Admin – Book Store" };

/**
 * Admin book list, newest first, with an "Add book" button (US-05) and per row Edit (US-15), Promotion (US-26)
 * and Delete (US-16, soft delete). Access: admin layout + RLS.
 */
export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<{ page?: string; deleted?: string }> }) {
  const params = await searchParams;
  const requested = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1;

  const supabase = await createClient();
  const { rows, total } = await listAdminBooks(supabase, page);
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  // Past the last page (e.g. the only book of the last page was just deleted): show the last page instead.
  if (page > totalPages) redirect(`/admin/books?page=${totalPages}${params.deleted === "1" ? "&deleted=1" : ""}`);
  const shownPage = page;

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

      {params.deleted === "1" && (
        <p role="status" className="mt-4 rounded-md border border-success bg-success-surface px-3 py-2 text-sm text-success">
          {BOOK_MESSAGES.deleted}
        </p>
      )}

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
            <DeleteBookButton bookId={book.id} title={book.title} page={shownPage} />
          </>
        )}
      />
      <AdminPager page={shownPage} totalPages={totalPages} />
    </>
  );
}
