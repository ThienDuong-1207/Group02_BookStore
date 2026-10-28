import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Access denied – Book Store" };

/** US-13 E2: shown when a customer (or a locked admin) opens /admin/**. */
export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-sm font-semibold text-danger">403</p>
      <h1 className="text-2xl font-semibold">You do not have permission to access this page.</h1>
      <Link
        href="/books"
        className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Back to the book list
      </Link>
    </main>
  );
}
