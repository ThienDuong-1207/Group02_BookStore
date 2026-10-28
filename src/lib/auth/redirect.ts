/**
 * Only allow redirects to paths on our own site after login (e.g. "/admin/users").
 * Rejects absolute URLs and protocol-relative "//evil.com" so `?next=` cannot be used for phishing.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/books"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
