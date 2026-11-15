import Link from "next/link";
import { secondaryButton } from "@/components/layout/styles";

/**
 * US-01 AC2 / US-09: shown instead of the grid when a search or a filter finds nothing.
 * "Clear search" removes only the keyword (other filters stay); "Clear filters" goes back to the full list.
 */
export function NoResults({ q, clearSearchHref }: { q: string; clearSearchHref: string }) {
  return (
    <div className="animate-rise mt-8 flex flex-col items-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="font-serif text-2xl font-medium">No results found</p>
      <p className="max-w-full text-sm break-words text-muted">
        {q ? <>No books match &ldquo;{q}&rdquo;.</> : "No books match the current filters."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {q && (
          <Link href={clearSearchHref} className={secondaryButton}>
            Clear search
          </Link>
        )}
        <Link href="/books" className={secondaryButton}>
          Clear filters
        </Link>
      </div>
    </div>
  );
}
