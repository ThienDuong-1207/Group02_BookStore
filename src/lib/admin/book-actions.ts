"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkAdmin } from "@/lib/admin/check-admin";
import { BOOK_MESSAGES, type BookFormState } from "@/lib/admin/book-messages";
import { MESSAGES } from "@/lib/auth/messages";
import { checkCoverUrl } from "@/lib/books/cover-check";
import { getEditableBook } from "@/lib/queries/books";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, toFieldErrors, type FieldErrors } from "@/lib/validation/auth";
import { BOOK_FIELDS, bookSchema, toBookRow, type BookInput } from "@/lib/validation/books";

/**
 * Checks that only the database can answer: the chosen author/category still exist and are not hidden,
 * and the cover link really returns an image (US-05 AC3). Returns field errors, or null when all is fine.
 */
async function checkReferences(supabase: SupabaseClient, input: BookInput): Promise<FieldErrors | null> {
  const [author, category, cover] = await Promise.all([
    supabase.from("authors").select("id").eq("id", input.authorId).eq("is_hidden", false).maybeSingle(),
    supabase.from("categories").select("id").eq("id", input.categoryId).eq("is_hidden", false).maybeSingle(),
    input.coverUrl ? checkCoverUrl(input.coverUrl) : Promise.resolve({ ok: true as const }),
  ]);
  const errors: FieldErrors = {};
  if (!author.data) errors.authorId = BOOK_MESSAGES.authorUnavailable;
  if (!category.data) errors.categoryId = BOOK_MESSAGES.categoryUnavailable;
  if (!cover.ok) errors.coverUrl = cover.reason;
  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * US-05: admin adds a book.
 * M1 saves it and returns "Book added"; M2 it is newest, so it is first on the list; E1/B1–B4 the server
 * re-validates with the same Zod schema as the form, so nothing invalid is saved even if the form is bypassed.
 */
export async function createBookAction(_prev: BookFormState, formData: FormData): Promise<BookFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;

  const parsed = bookSchema.safeParse(formDataToObject(formData, BOOK_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  // Normal server client (acts as the admin): RLS "books: admin insert" is the last line of defence (US-13 layer 3).
  const supabase = await createClient();
  const referenceErrors = await checkReferences(supabase, parsed.data);
  if (referenceErrors) return { fieldErrors: referenceErrors };

  const { error } = await supabase.from("books").insert(toBookRow(parsed.data));
  if (error) return { formError: MESSAGES.unexpected };

  revalidatePath("/admin/books");
  revalidatePath("/books"); // M2: shows up first on the customer list straight away
  return { success: BOOK_MESSAGES.added };
}

/**
 * US-15: admin edits a book. `bookId` is bound on the server page (`updateBookAction.bind(null, id)`).
 * E1: same validation as US-05. E2 / AC3: if the book does not exist or was soft-deleted (e.g. by another admin
 * while this form was open), nothing is saved and "Book not found" is shown.
 */
export async function updateBookAction(bookId: string, _prev: BookFormState, formData: FormData): Promise<BookFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;

  const parsed = bookSchema.safeParse(formDataToObject(formData, BOOK_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createClient();
  const current = await getEditableBook(supabase, bookId);
  if (!current) return { formError: BOOK_MESSAGES.notFound };

  // Only re-check the cover link when it changed: an unchanged cover was already checked when it was saved.
  const coverChanged = (parsed.data.coverUrl ?? null) !== current.cover_url;
  const referenceErrors = await checkReferences(supabase, coverChanged ? parsed.data : { ...parsed.data, coverUrl: undefined });
  if (referenceErrors) return { fieldErrors: referenceErrors };

  // `deleted_at is null` in the update itself closes the gap between the read above and this write.
  const { data, error } = await supabase
    .from("books")
    .update(toBookRow(parsed.data))
    .eq("id", bookId)
    .is("deleted_at", null)
    .select("id");
  if (error) return { formError: MESSAGES.unexpected };
  if (!data || data.length === 0) return { formError: BOOK_MESSAGES.notFound };

  // M1: list and detail pages show the new values.
  revalidatePath("/admin/books");
  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return { success: BOOK_MESSAGES.saved };
}
