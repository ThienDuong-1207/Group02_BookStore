/**
 * Lives in the `(list)` route group on purpose: a route-level loading.tsx makes Next.js stream the page, so the
 * HTTP status is sent before the page runs. Placed at `books/`, it also wrapped `books/[id]`, and notFound() for an
 * unknown book could no longer answer 404 (it answered 200 – a "soft 404", US-22 E1). Inside `(list)` it applies
 * to `/books` only; `/books/[id]` renders without streaming and keeps its real 404.
 *
 * Shown by Next.js while the book list is being fetched (when the visitor arrives from another page):
 * grey shapes with a moving shimmer in the place of the title, the filter panel and 8 cards, so the layout does
 * not jump when the real books arrive. Same grid as BookGrid (1 / 2 / 4 columns).
 */
export default function BooksLoading() {
  return (
    <main aria-busy="true" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 pb-16 md:pt-12">
      <p className="sr-only" role="status">
        Loading books…
      </p>
      <div className="shimmer h-10 w-56 rounded-md md:h-12" />
      <div className="shimmer mt-6 h-24 rounded-xl" />
      <ul aria-hidden="true" className="mt-8 grid grid-cols-1 gap-x-7 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="mx-auto w-full max-w-72 md:max-w-none">
            <div className="shimmer aspect-[2/3] rounded-md" />
            <div className="shimmer mt-4 h-5 w-4/5 rounded" />
            <div className="shimmer mt-2 h-4 w-1/2 rounded" />
          </li>
        ))}
      </ul>
    </main>
  );
}
