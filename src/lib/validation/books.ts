import { z } from "zod";

/**
 * US-05 / US-15: book form rules, shared by the client form and the server actions so both sides reject
 * exactly the same data (US-05 B4). Form inputs arrive as strings, so numbers are parsed here.
 */

/** Largest value we accept for price / stock (PostgreSQL `integer` stops at 2,147,483,647). */
export const MAX_PRICE = 1_000_000_000;
export const MAX_STOCK = 1_000_000;

/**
 * A whole number typed into a form field, e.g. "120000" → 120000.
 * Rejects empty input, decimals ("1.5"), signs ("-1"), letters ("abc") and values outside [min, max].
 */
export function wholeNumber({ min, max, required, invalid }: { min: number; max: number; required: string; invalid: string }) {
  return z
    .string(required)
    .trim()
    .min(1, required)
    .regex(/^\d+$/, invalid)
    .transform(Number)
    .refine((value) => value >= min && value <= max, invalid);
}

// B1: price > 0, whole VND. "0", "-5" and "abc" are rejected, "1" is accepted.
export const priceSchema = wholeNumber({
  min: 1,
  max: MAX_PRICE,
  required: "Price is required",
  invalid: "Price must be a whole number greater than 0 (VND)",
});

// B2 / AC4: stock is a whole number ≥ 0. "-1" is rejected, "0" is accepted.
export const stockSchema = wholeNumber({
  min: 0,
  max: MAX_STOCK,
  required: "Stock is required",
  invalid: "Stock must be a whole number of 0 or more",
});

/**
 * AC3: the cover is a link to an image on the Internet; only the URL is stored (no upload).
 * Optional: a book without a cover shows a placeholder on the list (US-19 E1).
 * Here we only check the format; the server also checks that the link really returns an image (cover-check.ts).
 */
export const coverUrlSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .trim()
    .max(2048, "The image link is too long (max 2048 characters)")
    .pipe(z.url({ protocol: /^https?$/, message: "Enter a valid image link starting with http:// or https://" }))
    .optional(),
);

export const bookSchema = z.object({
  // B3: title 1–200 characters, description 1–5000 characters (after trimming spaces).
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
  authorId: z.uuid("Choose an author"),
  categoryId: z.uuid("Choose a category"),
  price: priceSchema,
  stock: stockSchema,
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(5000, "Description must be at most 5000 characters"),
  coverUrl: coverUrlSchema,
});
export type BookInput = z.infer<typeof bookSchema>;

export const BOOK_FIELDS = ["title", "authorId", "categoryId", "price", "stock", "description", "coverUrl"] as const;

/** Maps validated form data to the columns of `public.books`. */
export function toBookRow(input: BookInput) {
  return {
    title: input.title,
    author_id: input.authorId,
    category_id: input.categoryId,
    price: input.price,
    stock: input.stock,
    description: input.description,
    cover_url: input.coverUrl ?? null,
  };
}
