import "server-only";

/**
 * US-05 AC3 (server side): does the cover link really point to an image?
 * The link must answer with an `image/*` Content-Type (JPG, PNG, WebP, GIF…). A web page, a 404 or a link that
 * does not answer within a few seconds is rejected, so a broken cover never reaches the catalogue.
 */

export type CoverCheckResult = { ok: true } | { ok: false; reason: string };

export const COVER_MESSAGES = {
  notImage: "This link does not point to an image (JPG, PNG, WebP or GIF)",
  unreachable: "We could not load an image from this link. Check the link and try again",
  privateHost: "Use a public image link from the Internet",
} as const;

const TIMEOUT_MS = 5000;

/**
 * Only admins can call this, but the server still should not be used to probe its own network:
 * links to localhost or private IP ranges are refused.
 */
function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1" || host === "0.0.0.0") return true;
  return /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
}

async function request(url: string, method: "HEAD" | "GET", fetchImpl: typeof fetch) {
  const response = await fetchImpl(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { Accept: "image/*" },
  });
  // We only need the headers: do not download the whole image.
  if (method === "GET") await response.body?.cancel().catch(() => undefined);
  return response;
}

function isImageResponse(response: Response): boolean {
  const type = response.headers.get("content-type")?.toLowerCase() ?? "";
  return response.ok && type.startsWith("image/");
}

export async function checkCoverUrl(url: string, fetchImpl: typeof fetch = fetch): Promise<CoverCheckResult> {
  if (isPrivateHost(new URL(url).hostname)) return { ok: false, reason: COVER_MESSAGES.privateHost };

  try {
    // HEAD is enough for most hosts; some do not support it, so fall back to GET.
    let response = await request(url, "HEAD", fetchImpl);
    if (!isImageResponse(response)) response = await request(url, "GET", fetchImpl);
    if (isImageResponse(response)) return { ok: true };
    return { ok: false, reason: response.ok ? COVER_MESSAGES.notImage : COVER_MESSAGES.unreachable };
  } catch {
    return { ok: false, reason: COVER_MESSAGES.unreachable };
  }
}
