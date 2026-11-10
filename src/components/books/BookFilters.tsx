import { SEARCH_MAX_LENGTH } from "@/lib/books/search";
import { primaryButton } from "@/components/layout/styles";

/**
 * Search bar on the book list page (US-01 M1/M2): always visible on the page (also on phones, where the header
 * search sits in the hamburger menu) and pre-filled with the current keyword.
 * A plain GET form, so it works without JavaScript; submitting drops `page`, so a new search starts on page 1.
 */
export function BookFilters({ q }: { q: string }) {
  return (
    <form action="/books" method="get" role="search" aria-label="Search books" className="mt-4 flex w-full min-w-0 gap-2">
      <label htmlFor="list-search" className="sr-only">
        Search by title or author
      </label>
      <input
        id="list-search"
        name="q"
        type="search"
        defaultValue={q}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder="Search by title or author…"
        className="min-h-11 w-full min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      <button type="submit" className={primaryButton}>
        Search
      </button>
    </form>
  );
}
