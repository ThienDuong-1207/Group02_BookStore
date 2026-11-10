/**
 * US-01 (GB-6) search helpers. Pure functions, so they are easy to test and the same rules run in the browser
 * (the search form) and on the server (the list query).
 */

/** B1: the keyword is at most 100 characters (the input also has maxLength=100). */
export const SEARCH_MAX_LENGTH = 100;

/**
 * B1 / AC3: the keyword as typed, cleaned up: leading/trailing spaces trimmed, inner runs of spaces collapsed to one,
 * cut to 100 characters. Empty or only spaces → "" (= no search, the full list).
 */
export function cleanKeyword(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_LENGTH).trim();
}

/**
 * AC1: lower case without Vietnamese marks, e.g. "Nguyễn Nhật Ánh" → "nguyen nhat anh".
 * NFD splits "ễ" into "e" + combining marks, which are then removed; "đ" has no decomposition, so it is mapped by hand.
 * The database folds titles and author names the same way (`unaccent` + `lower`, migration 20261111000001).
 */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
}

/**
 * B2: the `ilike` pattern for a keyword, with `%`, `_` and `\` escaped so they match themselves
 * (PostgreSQL LIKE treats them as wildcards). `*` is dropped because PostgREST turns it into `%`.
 * Values go through supabase-js filters (sent as a parameter), never into an SQL string, so `'` is harmless.
 * Returns null when there is nothing to search for (AC3).
 */
export function searchPattern(keyword: string): string | null {
  const folded = foldText(cleanKeyword(keyword)).replace(/\*/g, "").trim();
  if (!folded) return null;
  return `%${folded.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
