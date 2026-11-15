/**
 * Search box UI in the header (US-29 AC1). It sends `GET /books?q=…`; the search itself is built in US-01.
 * A plain form, so it works without JavaScript. The whole pill lights up while the field has the focus.
 */
export function SearchBox({ id }: { id: string }) {
  return (
    <form
      action="/books"
      method="get"
      role="search"
      className="flex w-full min-w-0 items-center rounded-full border border-line bg-surface pl-4 transition duration-200 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand-surface"
    >
      <label htmlFor={id} className="sr-only">
        Search books by title or author
      </label>
      <input
        id={id}
        name="q"
        type="search"
        maxLength={100}
        placeholder="Search by title or author…"
        className="min-h-11 w-full min-w-0 bg-transparent text-base outline-none"
      />
      <button
        type="submit"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-brand transition duration-200 hover:bg-brand hover:text-brand-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <SearchIcon />
        <span className="sr-only">Search</span>
      </button>
    </form>
  );
}

export function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4.5 4.5" strokeLinecap="round" />
    </svg>
  );
}
