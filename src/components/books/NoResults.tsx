import Link from "next/link";
import { secondaryButton } from "@/components/layout/styles";

/**
 * US-01 AC2: shown instead of the grid when a search finds nothing.
 * "Clear search" goes back to the full list.
 */
export function NoResults({ q, clearHref }: { q: string; clearHref: string }) {
  return (
    <div className="mt-6 flex flex-col items-center gap-3 rounded-lg border border-dashed border-line bg-surface p-8 text-center">
      <p className="text-lg font-semibold">No results found</p>
      {q && (
        <p className="max-w-full text-sm break-words text-muted">
          No books match &ldquo;{q}&rdquo;. Try another title or author name.
        </p>
      )}
      <Link href={clearHref} className={secondaryButton}>
        Clear search
      </Link>
    </div>
  );
}
