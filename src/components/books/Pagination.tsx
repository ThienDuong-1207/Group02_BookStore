import Link from "next/link";
import { pageHref, pageItems } from "@/lib/pagination";

type PaginationProps = {
  page: number;
  totalPages: number;
  pathname: string;
  /** Current query parameters; kept on every page link (search / filters, US-25). */
  params: Record<string, string | string[] | undefined>;
};

const itemClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * US-20 M1: Prev, page numbers, Next. B1: Prev is disabled on page 1 and Next on the last page.
 * Plain links (no JavaScript needed); the page number is in the URL, so reload and sharing keep the page (M2).
 */
export function Pagination({ page, totalPages, pathname, params }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <PageLink disabled={page <= 1} href={pageHref(pathname, params, page - 1)} label="Previous page">
        ‹ Prev
      </PageLink>

      {pageItems(page, totalPages).map((item, index) =>
        item === "…" ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={`${itemClass} border-brand bg-brand text-brand-foreground`}>
            {item}
          </span>
        ) : (
          <Link key={item} href={pageHref(pathname, params, item)} aria-label={`Page ${item}`} className={`${itemClass} border-line bg-surface hover:border-brand`}>
            {item}
          </Link>
        ),
      )}

      <PageLink disabled={page >= totalPages} href={pageHref(pathname, params, page + 1)} label="Next page">
        Next ›
      </PageLink>
    </nav>
  );
}

function PageLink({ disabled, href, label, children }: { disabled: boolean; href: string; label: string; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span aria-disabled="true" aria-label={label} className={`${itemClass} cursor-not-allowed border-line text-muted opacity-60`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={`${itemClass} border-line bg-surface hover:border-brand`}>
      {children}
    </Link>
  );
}
