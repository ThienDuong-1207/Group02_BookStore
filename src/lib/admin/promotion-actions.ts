"use server";

import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/admin/check-admin";
import { BOOK_MESSAGES, type BookFormState } from "@/lib/admin/book-messages";
import { MESSAGES } from "@/lib/auth/messages";
import { getEditableBook } from "@/lib/queries/books";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, toFieldErrors } from "@/lib/validation/auth";
import { PROMOTION_FIELDS, promotionSchema } from "@/lib/validation/promotions";

export type PromotionFormState = BookFormState;

function refresh(bookId: string) {
  revalidatePath(`/admin/books/${bookId}/promotion`);
  revalidatePath("/admin/books");
  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
}

/**
 * US-26: create or replace the promotion of one title (one promotion per book, upsert on book_id).
 * AC1/AC2 are re-checked here with the same schema as the form, and again by the CHECK constraints in the database.
 */
export async function savePromotionAction(bookId: string, _prev: PromotionFormState, formData: FormData): Promise<PromotionFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;

  const parsed = promotionSchema.safeParse(formDataToObject(formData, PROMOTION_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createClient();
  if (!(await getEditableBook(supabase, bookId))) return { formError: BOOK_MESSAGES.notFound };

  const { error } = await supabase.from("promotions").upsert(
    {
      book_id: bookId,
      discount_percent: parsed.data.discountPercent,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    },
    { onConflict: "book_id" },
  );
  if (error) return { formError: MESSAGES.unexpected };

  refresh(bookId);
  return { success: "Promotion saved" };
}

/** US-26: remove the promotion of one title; customers see only the original price again. */
// The (prev, formData) parameters are required by useActionState even though removing needs neither.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removePromotionAction(bookId: string, _prev: PromotionFormState, _formData: FormData): Promise<PromotionFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;

  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("book_id", bookId);
  if (error) return { formError: MESSAGES.unexpected };

  refresh(bookId);
  return { success: "Promotion removed" };
}
