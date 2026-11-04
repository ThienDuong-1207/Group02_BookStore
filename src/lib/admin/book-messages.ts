import type { FieldErrors } from "@/lib/validation/auth";

/** What the book server actions return to the form (a "use server" file may only export async functions). */
export type BookFormState = {
  fieldErrors?: FieldErrors;
  formError?: string;
  success?: string;
};

export const BOOK_MESSAGES = {
  added: "Book added",
  saved: "Changes saved",
  notFound: "Book not found",
  authorUnavailable: "Choose an author from the list",
  categoryUnavailable: "Choose a category from the list",
} as const;
