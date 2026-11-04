import Link from "next/link";

/** US-15 E2: editing a soft-deleted, unknown or malformed book id (HTTP 404, no stack trace). */
export default function BookNotFound() {
  return (
    <div className="rounded-lg border border-line bg-surface p-8 text-center">
      <h1 className="text-xl font-semibold">Book not found</h1>
      <p className="mt-2 text-sm text-muted">It may have been deleted or the link is wrong.</p>
      <Link
        href="/admin/books"
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Back to books
      </Link>
    </div>
  );
}
