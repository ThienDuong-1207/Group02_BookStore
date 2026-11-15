import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BookCover } from "@/components/books/BookCover";
import { COVER_TRANSITION_NAME } from "@/components/motion/names";
import { PriceTag } from "@/components/books/PriceTag";
import { SoldOutBadge } from "@/components/books/SoldOutBadge";
import { safeListHref } from "@/lib/books/list-href";
import { getPublicBook } from "@/lib/queries/book-detail";
import { getPromotion } from "@/lib/queries/promotions";
import { effectivePrice, isPromotionActive, todayInVietnam } from "@/lib/promotions/price";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  /** `from`: the list URL the visitor came from (US-22), set by the book card. */
  searchParams?: Promise<{ from?: string | string[] }>;
};

// One database read per request, shared by generateMetadata and the page.
const loadBook = cache(async (id: string) => getPublicBook(await createClient(), id));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await loadBook((await params).id);
  return { title: book ? `${book.title} – Book Store` : "Book not found – Book Store" };
}

/**
 * US-02 book detail page (task 3.3.1).
 * M1: large cover, title, author, category, price, stock status (In stock / Sold Out) and the full description.
 * M2: no "Add to Cart" button – shopping is out of scope for Release 1.0.
 * B1: one column on phones, cover beside the details from 768 px; long titles and descriptions wrap.
 * Unknown, malformed or soft-deleted id → 404 page (US-22 E1).
 * US-22 M1 / B1: "Back to list" goes to the list page the visitor came from (same page, search and filters),
 * or to `/books` page 1 when the page was opened directly. The browser Back button works as usual.
 * US-28 (CR-02): the price comes from the same US-26 service as the list (US-27), for today in Vietnam:
 * AC1 active promotion → original price struck through, sale price and "-x%"; AC2 / CR-02 AC4 after the end date
 * (or before the start) → only the original price; AC3 the start and end days are both included.
 * The page is rendered on every request, so the price changes on the day the promotion ends, with no redeploy.
 * Motion (style guide §6): the cover is the landing place of the list → detail cover animation and stays in
 * view on tablet / desktop while the description scrolls; the text column fades in.
 */
export default async function BookDetailPage({ params, searchParams }: Props) {
  const book = await loadBook((await params).id);
  if (!book) notFound();
  const backHref = safeListHref((await searchParams)?.from);

  // If the promotion cannot be loaded, show the original price (same fallback as the list, US-27).
  const promotion = await getPromotion(await createClient(), book.id).catch((error: unknown) => {
    console.error("Could not load the promotion of a book", error);
    return null;
  });
  const today = todayInVietnam();
  const pricing = effectivePrice(book.price, promotion, today);
  const saleEnds = promotion && isPromotionActive(promotion, today) ? formatDay(promotion.end_date) : null;

  const inStock = book.stock > 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16 md:pt-10">
      <Link
        href={backHref}
        className="group inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-x-1">
          ←
        </span>{" "}
        Back to list
      </Link>

      <article className="mt-4 grid items-start gap-8 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-12 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-14">
        {/* From 768 px the cover stays in view (sticky) while a long description scrolls. */}
        <div className="mx-auto w-full max-w-64 md:sticky md:top-24 md:max-w-none">
          <BookCover src={book.cover_url} title={book.title} transitionName={COVER_TRANSITION_NAME} />
        </div>

        <div className="animate-rise flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Link
              href={`/books?category=${encodeURIComponent(book.category_id)}`}
              className="self-start rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              {book.category_name}
            </Link>
            <h1 className="text-3xl leading-tight font-medium break-words md:text-5xl">{book.title}</h1>
            <p className="text-lg text-muted">
              by <span className="font-medium text-foreground">{book.author_name}</span>
            </p>
          </div>

          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface p-4">
            <dt className="text-sm text-muted">Price</dt>
            <dd>
              <PriceTag price={book.price} pricing={pricing} size="detail" />
              {saleEnds && <p className="mt-1 text-sm text-muted">Promotion until {saleEnds}</p>}
            </dd>
            <dt className="text-sm text-muted">Availability</dt>
            <dd>
              {inStock ? (
                <span className="rounded-full bg-success-surface px-2.5 py-0.5 text-sm font-medium text-success">In stock</span>
              ) : (
                <SoldOutBadge className="text-sm" />
              )}
            </dd>
          </dl>

          <section aria-labelledby="description-heading" className="max-w-prose">
            <h2 id="description-heading" className="text-xl font-semibold">
              Description
            </h2>
            <p className="mt-3 leading-relaxed break-words whitespace-pre-line">{book.description}</p>
          </section>
        </div>
      </article>
    </main>
  );
}

/** "2026-11-15" → "15/11/2026" (dates are calendar days in Vietnam, US-26). */
function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
