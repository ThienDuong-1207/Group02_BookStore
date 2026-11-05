import { z } from "zod";

/**
 * Categories (US-17) and authors (US-18) are managed the same way: add, rename, hide/show.
 * This file holds what differs between them (table, name length, messages) and the name rule
 * shared by the client forms and the server actions (B1), so both sides reject exactly the same data.
 * It has no server-only code, so the client forms can import it.
 */

type CatalogConfig = {
  /** Table in `public` (also used as the kind in URLs and bound action arguments). */
  table: string;
  /** Column of `books` that points to this table – used to block hiding an item that still has books (E2). */
  bookColumn: string;
  /** B1: longest name, same as the CHECK constraint in the schema migration. */
  maxLength: number;
  /** "Category" / "Author". */
  label: string;
  /** "categories" / "authors" (lower case, for counts like "8 categories"). */
  plural: string;
  /** Admin page of this list. */
  path: string;
  messages: {
    required: string;
    tooLong: string;
    exists: string;
    inUse: string;
    notFound: string;
    added: (name: string) => string;
    renamed: (name: string) => string;
    hidden: (name: string) => string;
    shown: (name: string) => string;
  };
};

function catalogConfig(c: Omit<CatalogConfig, "messages"> & { inUse: string }): CatalogConfig {
  const { inUse, ...rest } = c;
  return {
    ...rest,
    messages: {
      required: `${c.label} name is required`,
      tooLong: `${c.label} name must be at most ${c.maxLength} characters`,
      exists: `${c.label} already exists`, // E1
      inUse, // E2
      notFound: `${c.label} not found`,
      added: (name) => `${c.label} "${name}" added.`,
      renamed: (name) => `Renamed to "${name}".`,
      hidden: (name) => `"${name}" is hidden. Customers no longer see it and it is not offered in the book form.`,
      shown: (name) => `"${name}" is visible again.`,
    },
  };
}

export const CATALOG = {
  categories: catalogConfig({
    table: "categories",
    bookColumn: "category_id",
    maxLength: 100,
    label: "Category",
    plural: "categories",
    path: "/admin/categories",
    inUse: "Move or delete the books in this category first",
  }),
} satisfies Record<string, CatalogConfig>;

export type CatalogKind = keyof typeof CATALOG;

/** Bound action arguments come from the browser, so the kind is checked against this list on the server. */
export function isCatalogKind(value: unknown): value is CatalogKind {
  return typeof value === "string" && Object.hasOwn(CATALOG, value);
}

/** B1: name is trimmed, then must be 1–maxLength characters. Empty or whitespace-only is rejected. */
export function catalogNameSchema(kind: CatalogKind) {
  const { maxLength, messages } = CATALOG[kind];
  return z.object({
    name: z.string(messages.required).trim().min(1, messages.required).max(maxLength, messages.tooLong),
  });
}

export const CATALOG_FIELDS = ["name"] as const;
