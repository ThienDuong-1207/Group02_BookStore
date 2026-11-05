"use server";

import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/lib/admin/check-admin";
import type { BookFormState } from "@/lib/admin/book-messages";
import { MESSAGES } from "@/lib/auth/messages";
import { isUuid } from "@/lib/queries/books";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject, toFieldErrors } from "@/lib/validation/auth";
import { CATALOG, CATALOG_FIELDS, catalogNameSchema, isCatalogKind } from "@/lib/validation/catalog";

/** Same shape as the book forms: field errors, a form error or a success message. */
type CatalogFormState = BookFormState;

/** PostgreSQL "unique_violation": the case-insensitive unique index on `name` already has this name (E1). */
const UNIQUE_VIOLATION = "23505";

/**
 * Category / author management (US-17, US-18). Every action:
 * 1. checks the role on the server (US-13 E3) and the kind against a fixed list (the kind is bound in the browser);
 * 2. validates the name with the same schema as the form (B1);
 * 3. writes with the normal server client acting as the admin, so RLS is the last line of defence.
 * E1 duplicates are detected by the database's unique index, so two admins saving at once cannot both win.
 */

function refresh(kind: keyof typeof CATALOG) {
  revalidatePath(CATALOG[kind].path);
  // The header category menu, the book form dropdowns and the customer list all read these names.
  revalidatePath("/", "layout");
}

/** M1: add a new category / author (visible). */
export async function createCatalogItemAction(kind: string, _prev: CatalogFormState, formData: FormData): Promise<CatalogFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;
  if (!isCatalogKind(kind)) return { formError: MESSAGES.unexpected };
  const { table, messages } = CATALOG[kind];

  const parsed = catalogNameSchema(kind).safeParse(formDataToObject(formData, CATALOG_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { name } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ name });
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { fieldErrors: { name: messages.exists } };
    return { formError: MESSAGES.unexpected };
  }

  refresh(kind);
  return { success: messages.added(name) };
}

/** M1: rename. Changing only the letter case of the same item is allowed (the index ignores the row itself). */
export async function renameCatalogItemAction(
  kind: string,
  id: string,
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;
  if (!isCatalogKind(kind)) return { formError: MESSAGES.unexpected };
  const { table, messages } = CATALOG[kind];
  if (!isUuid(id)) return { formError: messages.notFound };

  const parsed = catalogNameSchema(kind).safeParse(formDataToObject(formData, CATALOG_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { name } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.from(table).update({ name }).eq("id", id).select("id");
  if (error) {
    if (error.code === UNIQUE_VIOLATION) return { fieldErrors: { name: messages.exists } };
    return { formError: MESSAGES.unexpected };
  }
  if (!data || data.length === 0) return { formError: messages.notFound };

  refresh(kind);
  return { success: messages.renamed(name) };
}

/**
 * M1: hide or show again. Hidden items are not offered to customers (header menu, filter, list via `books_public`)
 * nor in the book form (AC3).
 * E2: hiding is blocked while books that are not deleted still use the item – otherwise those books would
 * silently disappear from the store. Showing again is always allowed.
 */
export async function setCatalogItemHiddenAction(
  kind: string,
  id: string,
  _prev: CatalogFormState,
  formData: FormData,
): Promise<CatalogFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;
  // The wanted state comes from the form ("true" = hide, "false" = show), so a re-rendered row never sends a stale value.
  const wanted = formData.get("hidden");
  if (!isCatalogKind(kind) || (wanted !== "true" && wanted !== "false")) return { formError: MESSAGES.unexpected };
  const hidden = wanted === "true";
  const { table, bookColumn, messages } = CATALOG[kind];
  if (!isUuid(id)) return { formError: messages.notFound };

  const supabase = await createClient();

  if (hidden) {
    // Count only, no rows are loaded.
    const { count, error } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq(bookColumn, id)
      .is("deleted_at", null);
    if (error) return { formError: MESSAGES.unexpected };
    if ((count ?? 0) > 0) return { formError: `${messages.inUse} (${count} ${count === 1 ? "book" : "books"}).` };
  }

  const { data, error } = await supabase.from(table).update({ is_hidden: hidden }).eq("id", id).select("name");
  if (error) return { formError: MESSAGES.unexpected };
  if (!data || data.length === 0) return { formError: messages.notFound };

  refresh(kind);
  const name = (data[0] as { name: string }).name;
  return { success: hidden ? messages.hidden(name) : messages.shown(name) };
}
