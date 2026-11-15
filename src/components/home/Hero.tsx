import Link from "next/link";
import { BookCover } from "@/components/books/BookCover";
import { SearchIcon } from "@/components/layout/SearchBox";

export type HeroBook = { id: string; title: string; cover_url: string | null };

/*
 * Position of the three covers in the fan: left, centre (in front), right. `shift` is how far each one drifts
 * while the hero scrolls away (`.parallax` in globals.css) – different distances give the feeling of depth.
 */
const FAN = [
  { place: "left-[2%] top-[14%] w-[42%] -rotate-[9deg]", shift: "-2rem", delay: 120 },
  { place: "left-[27%] top-[2%] z-10 w-[46%] rotate-2", shift: "1.5rem", delay: 0 },
  { place: "left-[56%] top-[16%] w-[42%] rotate-[10deg]", shift: "-4rem", delay: 220 },
];

/**
 * Home page hero: headline, short introduction, a large search box (same `GET /books?q=` as the header search,
 * US-01) and a fan of the three newest covers.
 * Motion (style guide §6): text and covers rise in one after another when the page opens; the covers then drift
 * at different speeds as the page scrolls (parallax). With fewer than three books the fan is simply smaller.
 */
export function Hero({ books }: { books: HeroBook[] }) {
  return (
    <section aria-labelledby="hero-title" className="overflow-x-clip">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-8 pb-12 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-12 md:pt-14 md:pb-20">
        <div className="min-w-0">
          <p className="eyebrow animate-rise">Release 1.0 · Book catalogue</p>
          <h1 id="hero-title" className="animate-rise mt-4 text-5xl leading-[1.05] font-medium md:text-6xl lg:text-7xl" style={{ "--rise-delay": "60ms" } as React.CSSProperties}>
            Find the book you&rsquo;ll <em className="text-brand">stay up late</em> for.
          </h1>
          <p className="animate-rise mt-5 max-w-xl text-lg text-muted" style={{ "--rise-delay": "120ms" } as React.CSSProperties}>
            Browse the full catalogue of Ms. Le&rsquo;s book company. Search by title or author, filter by category and
            price, and see what is in stock today.
          </p>

          <form
            action="/books"
            method="get"
            role="search"
            aria-label="Search the catalogue"
            className="animate-rise mt-7 flex max-w-lg items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-1.5 pl-5 shadow-lg shadow-foreground/5 transition duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-surface"
            style={{ "--rise-delay": "180ms" } as React.CSSProperties}
          >
            <span className="text-muted">
              <SearchIcon />
            </span>
            <label htmlFor="hero-search" className="sr-only">
              Search books by title or author
            </label>
            <input
              id="hero-search"
              name="q"
              type="search"
              maxLength={100}
              placeholder="Title or author…"
              className="min-h-11 w-full min-w-0 bg-transparent text-base outline-none"
            />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-brand-foreground transition duration-200 hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:scale-[0.97]"
            >
              Search
            </button>
          </form>

          <p className="animate-rise mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted" style={{ "--rise-delay": "240ms" } as React.CSSProperties}>
            <Link href="/books" className="group inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand hover:underline">
              Browse all books
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
            <span>No account needed to look around.</span>
          </p>
        </div>

        {books.length > 0 && (
          // Decorative: the same books are listed (with links) in "New books" below.
          <div aria-hidden="true" className="relative mx-auto aspect-[5/4] w-full max-w-md md:max-w-none">
            {books.slice(0, 3).map((book, index) => {
              const fan = books.length === 1 ? FAN[1] : FAN[index];
              return (
                <div key={book.id} className={`parallax absolute ${fan.place}`} style={{ "--parallax-shift": fan.shift } as React.CSSProperties}>
                  <div className="animate-rise" style={{ "--rise-delay": `${fan.delay}ms` } as React.CSSProperties}>
                    <BookCover src={book.cover_url} title={book.title} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
