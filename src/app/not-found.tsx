import Link from "next/link";

/** Friendly 404 for any unknown URL (no stack trace). */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-semibold text-brand">404</p>
      <h1 className="text-2xl font-semibold">Sorry, we couldn&apos;t find this page.</h1>
      <Link
        href="/books"
        className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Back to the book list
      </Link>
    </main>
  );
}
