import type { Metadata } from "next";

export const metadata: Metadata = { title: "Books – Book Store" };

/**
 * Placeholder for the book list. The grid, pagination, search and filters come in
 * US-19, US-20, US-01, US-09 and US-25 (Sprint 2–3). Login/logout already redirect here (US-10).
 */
export default function BooksPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Books</h1>
      <p className="mt-4 rounded-lg border border-dashed border-line bg-surface p-8 text-center text-muted">
        No books available yet.
      </p>
    </main>
  );
}
