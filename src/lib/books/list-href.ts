/**
 * US-22 M1 / B1: the detail page's "Back to list" returns to the exact list page the visitor came from
 * (page number + search + filters). The list URL travels in the detail link as `?from=<encoded /books URL>`
 * (PROJECT_SPEC implementation hint) – no cookies or session state needed, and it survives reload and sharing.
 */

export const LIST_PATH = "/books";
const BASE = "http://bookstore.local";

/**
 * The list URL to go back to, or `/books` (page 1) when there is none or it is not acceptable.
 * `from` comes from the address bar, so it is only accepted as a link to the book list on this site:
 * other paths (`/admin`, `/books/<id>`), other sites (`//evil.example`, `https://…`) and tricks such as
 * `/books/../admin` or backslashes are rejected – an open redirect is impossible.
 */
export function safeListHref(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || value.length > 2000 || !value.startsWith(LIST_PATH) || value.includes("\\")) return LIST_PATH;
  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return LIST_PATH;
  }
  if (url.origin !== BASE || url.pathname !== LIST_PATH) return LIST_PATH;
  url.searchParams.delete("from"); // never nest a "from" inside a "from"
  const search = url.searchParams.toString();
  return search ? `${LIST_PATH}?${search}` : LIST_PATH;
}

/** Link from a card to the detail page; carries the list URL unless it is plain page 1 of the full list. */
export function detailHref(bookId: string, listHref: string = LIST_PATH): string {
  const path = `${LIST_PATH}/${encodeURIComponent(bookId)}`;
  const back = safeListHref(listHref);
  return back === LIST_PATH ? path : `${path}?from=${encodeURIComponent(back)}`;
}
