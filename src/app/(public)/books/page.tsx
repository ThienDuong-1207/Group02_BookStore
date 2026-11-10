import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listPublicBooks } from "@/lib/queries/book-list";
import { getPromotionsForBooks } from "@/lib/queries/promotions";
import { todayInVietnam } from "@/lib/promotions/price";
import { withEffectivePrices } from "@/lib/books/card-price";
import { PAGE_SIZE, pageHref, parsePage, totalPages } from "@/lib/pagination";
import { cleanKeyword } from "@/lib/books/search";
import { BookFilters } from "@/components/books/BookFilters";
import { BookGrid } from "@/components/books/BookGrid";
import { NoResults } from "@/components/books/NoResults";
import { Pagination } from "@/components/books/Pagination";

export const metadata: Metadata = { title: "Books – Book Store" };

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Home page content: the "New books" grid (US-19), 12 per page, newest first (US-20).
 * Cards show cover, title, author and price; the grid is 1 / 2 / 4 columns on phone / tablet / desktop.
 * US-27 (CR-02): books under an active promotion show the original price struck through, the sale price and "-x%".
 * US-01: `?q=` keeps only books whose title or author contains the keyword (case- and accent-insensitive).
 * The count, page numbers and "past the end" redirect all use the filtered total, and page links keep `q` (US-25).
 */
export default async function BooksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = parsePage(params.page); // E1: 0, negative, non-numeric → 1
  const q = cleanKeyword(params.q); // US-01 B1 / AC3: trimmed, max 100 chars; empty → full list

  const supabase = await createClient();
  const { books, total } = await listPublicBooks(supabase, page, { q });
  const lastPage = totalPages(total);

  // E1: a page past the end → the last page (keeps the other query parameters).
  if (total > 0 && page > lastPage) redirect(pageHref("/books", params, lastPage));

  const first = (page - 1) * PAGE_SIZE + 1;

  // US-27: one query for the promotions of the 12 books on this page (not one per card).
  // If it fails, the list still works and shows original prices (same as "no active promotion", AC2).
  const promotions = await getPromotionsForBooks(
    supabase,
    books.map((book) => book.id),
  ).catch((error: unknown) => {
    console.error("Could not load promotions for the book list", error);
    return new Map();
  });
  const cards = withEffectivePrices(books, promotions, todayInVietnam());

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="min-w-0 text-2xl font-semibold break-words md:text-3xl">
          {q ? <>Results for &ldquo;{q}&rdquo;</> : "New books"}
        </h1>
        {total > 0 && (
          <p className="text-sm text-muted">
            Showing {first}–{first + books.length - 1} of {total} · Page {page} of {lastPage}
          </p>
        )}
      </div>

      <BookFilters q={q} />

      {q && total === 0 ? <NoResults q={q} clearHref="/books" /> : <BookGrid books={cards} />}

      <Pagination page={page} totalPages={lastPage} pathname="/books" params={params} />
    </main>
  );
}
