import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEditableBook, listBookOptions } from "@/lib/queries/books";
import { updateBookAction } from "@/lib/admin/book-actions";
import { BookForm } from "@/components/admin/BookForm";

export const metadata: Metadata = { title: "Edit book – Admin – Book Store" };

/** US-15 M1: the edit form, pre-filled with the book's current values. E2: unknown / deleted id → "Book not found". */
export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [book, { authors, categories }] = await Promise.all([getEditableBook(supabase, id), listBookOptions(supabase)]);
  if (!book) notFound();

  return (
    <>
      <Link href="/admin/books" className="inline-flex min-h-11 items-center text-sm text-brand hover:underline">
        ← Back to books
      </Link>
      <h1 className="text-2xl font-semibold break-words">Edit “{book.title}”</h1>
      <section className="mt-6 rounded-lg border border-line bg-surface p-5">
        <BookForm
          action={updateBookAction.bind(null, book.id)}
          authors={authors}
          categories={categories}
          initial={{
            title: book.title,
            authorId: book.author_id,
            categoryId: book.category_id,
            price: String(book.price),
            stock: String(book.stock),
            description: book.description,
            coverUrl: book.cover_url ?? "",
          }}
          submitLabel="Save changes"
          pendingLabel="Saving…"
        />
      </section>
    </>
  );
}
