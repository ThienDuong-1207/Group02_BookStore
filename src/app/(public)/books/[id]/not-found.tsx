"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { safeListHref } from "@/lib/books/list-href";

/**
 * US-22 E1 (task 3.3.2): shown with HTTP 404 when `/books/<id>` does not exist, is malformed, was soft-deleted
 * (US-16) or belongs to a hidden category / author. A friendly message, no technical error.
 * The button goes back to the list page the visitor came from (`?from=`), or to `/books` page 1 (B1).
 */
export default function BookNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-12 w-12 text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
        <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
        <path d="M10 8.5l4 4m0-4l-4 4" strokeLinecap="round" />
      </svg>
      <p className="text-sm font-semibold text-brand">Book not found</p>
      <h1 className="text-2xl font-semibold">Sorry, we couldn&apos;t find this book.</h1>
      <p className="text-muted">It may have been removed, or the link is wrong.</p>
      {/* useSearchParams needs a Suspense boundary; until it resolves the button simply goes to page 1. */}
      <Suspense fallback={<BackToList href="/books" />}>
        <BackToListFromUrl />
      </Suspense>
    </main>
  );
}

function BackToListFromUrl() {
  const from = useSearchParams().get("from") ?? undefined;
  return <BackToList href={safeListHref(from)} />;
}

function BackToList({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      Back to list
    </Link>
  );
}
