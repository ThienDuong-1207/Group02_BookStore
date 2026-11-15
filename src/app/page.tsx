import type { Metadata } from "next";
import Link from "next/link";
import { BookGrid } from "@/components/books/BookGrid";
import { Hero } from "@/components/home/Hero";
import { SectionHeading } from "@/components/home/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { withEffectivePrices } from "@/lib/books/card-price";
import { todayInVietnam } from "@/lib/promotions/price";
import { listPublicBooks } from "@/lib/queries/book-list";
import { categoryHref, listMenuCategories } from "@/lib/queries/categories";
import { listOnSaleBooks } from "@/lib/queries/home";
import { getPromotionsForBooks } from "@/lib/queries/promotions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Book Store – Team 02" };

/** How many of the newest books the home page shows (two rows of four on desktop). The full list is `/books`. */
const NEW_BOOKS_ON_HOME = 8;

/**
 * Home page `/` (PROJECT_SPEC §6): a welcome page in front of the catalogue. It only READS the catalogue –
 * every book shown here is a normal book card that opens `/books/[id]`, and all "see all" links go to `/books`,
 * where the full list, search, filters and pagination live (US-19, 20, 01, 09, 25 are unchanged).
 *
 * Sections, top to bottom:
 *   1. Hero – headline, search box (GET /books?q=), fan of the three newest covers.
 *   2. Numbers – how many books and categories the catalogue has (real counts from the database).
 *   3. Browse by category – one link per visible category → `/books?category=<id>`.
 *   4. On sale today – books with an active promotion (CR-02); hidden when there is none.
 *   5. New books – the 8 newest books, newest first (same order as the list page).
 *   6. Closing band with a button to the full catalogue.
 *
 * The page stays up when an optional part cannot be read: promotions fall back to original prices / no sale
 * section, categories to an empty list (same rules as the list page and the header).
 */
export default async function HomePage() {
  const supabase = await createClient();
  const today = todayInVietnam();

  const [{ books: newest, total }, categories, onSale] = await Promise.all([
    listPublicBooks(supabase, 1), // page 1 = the 12 newest; soft-deleted and hidden books never appear (US-19 B1)
    listMenuCategories(supabase),
    listOnSaleBooks(supabase, today).catch((error: unknown) => {
      console.error("Could not load the books on sale for the home page", error);
      return [];
    }),
  ]);

  const newBooks = newest.slice(0, NEW_BOOKS_ON_HOME);
  const promotions = await getPromotionsForBooks(
    supabase,
    newBooks.map((book) => book.id),
  ).catch((error: unknown) => {
    console.error("Could not load promotions for the home page", error);
    return new Map();
  });
  const newCards = withEffectivePrices(newBooks, promotions, today);
  const heroBooks = newest.filter((book) => book.cover_url).slice(0, 3);

  return (
    <main className="flex-1">
      <Hero books={heroBooks} />

      <div className="border-y border-line">
        <dl className="mx-auto flex max-w-6xl flex-wrap gap-x-12 gap-y-3 px-4 py-5 text-sm text-muted">
          <Fact value={total} label={total === 1 ? "book" : "books"} />
          <Fact value={categories.length} label={categories.length === 1 ? "category" : "categories"} />
          <Fact value={12} label="books per page, newest first" />
        </dl>
      </div>

      {categories.length > 0 && (
        <section aria-labelledby="home-categories" className="mx-auto max-w-6xl px-4 pt-16">
          <SectionHeading id="home-categories" eyebrow="Shelves" title="Browse by category" />
          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <Reveal as="li" key={category.id} delay={(index % 4) * 60} className="flex min-w-0">
                <Link
                  href={categoryHref(category.id)}
                  className="group flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-5 py-3 font-serif text-lg font-medium transition duration-300 hover:-translate-y-0.5 hover:border-brand hover:bg-brand hover:text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <span className="min-w-0 break-words">{category.name}</span>
                  <span aria-hidden="true" className="text-muted transition duration-300 group-hover:translate-x-1 group-hover:text-brand-foreground">
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      {onSale.length > 0 && (
        <section aria-labelledby="home-sale" className="mx-auto max-w-6xl px-4 pt-16">
          <SectionHeading id="home-sale" eyebrow="Promotions" title="On sale today" href="/books" linkLabel="See all books" />
          <BookGrid books={onSale} />
        </section>
      )}

      <section aria-labelledby="home-new" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionHeading id="home-new" eyebrow="Just added" title="New books" href="/books" linkLabel="See all books" />
        <BookGrid books={newCards} />
      </section>

      <section aria-labelledby="home-catalogue" className="mt-20 bg-brand text-brand-foreground">
        <Reveal className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-12 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h2 id="home-catalogue" className="text-3xl leading-tight font-medium md:text-4xl">
              The whole catalogue, one page at a time.
            </h2>
            <p className="mt-3 max-w-xl text-on-brand-muted">
              The full list shows 12 books per page, with search and filters that stay with you from page to page.
            </p>
          </div>
          <Link
            href="/books"
            className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-md bg-surface px-6 font-medium text-brand transition duration-200 hover:shadow-lg active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Open the catalogue
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </Reveal>
      </section>
    </main>
  );
}

function Fact({ value, label }: { value: number; label: string }) {
  return (
    // `dt` must come first in the HTML; `flex-row-reverse` shows the number before its label.
    <div className="flex flex-row-reverse items-baseline justify-end gap-2">
      <dt>{label}</dt>
      <dd className="font-serif text-2xl font-semibold text-foreground tabular-nums">{value}</dd>
    </div>
  );
}
