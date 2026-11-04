import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listBookOptions } from "@/lib/queries/books";
import { createBookAction } from "@/lib/admin/book-actions";
import { BookForm } from "@/components/admin/BookForm";

export const metadata: Metadata = { title: "Add book – Admin – Book Store" };

/** US-05 M1: add a new book. Only visible authors / categories are offered. */
export default async function NewBookPage() {
  const supabase = await createClient();
  const { authors, categories } = await listBookOptions(supabase);

  return (
    <>
      <Link href="/admin/books" className="inline-flex min-h-11 items-center text-sm text-brand hover:underline">
        ← Back to books
      </Link>
      <h1 className="text-2xl font-semibold">Add book</h1>
      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <BookForm
          action={createBookAction}
          authors={authors}
          categories={categories}
          submitLabel="Save"
          pendingLabel="Saving…"
          resetOnSuccess
        />
      </section>
    </>
  );
}
