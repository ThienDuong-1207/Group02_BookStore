import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BookCover } from "@/components/books/BookCover";
import { formatPrice } from "@/lib/format";
import { getPublicBook } from "@/lib/queries/book-detail";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

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
 */
export default async function BookDetailPage({ params }: Props) {
  const book = await loadBook((await params).id);
  if (!book) notFound();

  const inStock = book.stock > 0;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">
      <Link
        href="/books"
        className="inline-flex min-h-11 items-center gap-1 rounded-md text-sm font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span aria-hidden="true">←</span> Back to list
      </Link>

      <article className="mt-4 grid gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-xs md:max-w-none">
          <BookCover src={book.cover_url} title={book.title} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Link
              href={`/books?category=${encodeURIComponent(book.category_id)}`}
              className="self-start rounded-full bg-brand-surface px-3 py-1 text-xs font-semibold text-brand hover:underline"
            >
              {book.category_name}
            </Link>
            <h1 className="text-2xl leading-tight font-semibold break-words md:text-3xl">{book.title}</h1>
            <p className="text-muted">
              by <span className="font-medium text-foreground">{book.author_name}</span>
            </p>
          </div>

          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-surface p-4">
            <dt className="text-sm text-muted">Price</dt>
            <dd className="text-xl font-semibold">{formatPrice(book.price)}</dd>
            <dt className="text-sm text-muted">Availability</dt>
            <dd>
              {inStock ? (
                <span className="rounded-full bg-success-surface px-2.5 py-0.5 text-sm font-medium text-success">In stock</span>
              ) : (
                <span className="rounded-full bg-danger-surface px-2.5 py-0.5 text-sm font-medium text-danger">Sold Out</span>
              )}
            </dd>
          </dl>

          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="text-lg font-semibold">
              Description
            </h2>
            <p className="mt-2 leading-relaxed break-words whitespace-pre-line">{book.description}</p>
          </section>
        </div>
      </article>
    </main>
  );
}
