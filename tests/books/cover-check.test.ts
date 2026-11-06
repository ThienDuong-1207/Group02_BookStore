import { describe, expect, it, vi } from "vitest";
import { COVER_MESSAGES, checkCoverUrl } from "@/lib/books/cover-check";

/** US-05 AC3 (server side): the cover link must really return an image. No real network calls. */

function response(status: number, contentType?: string) {
  return new Response(null, { status, headers: contentType ? { "content-type": contentType } : {} });
}

describe("checkCoverUrl", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "IMAGE/GIF"])("accepts a link that returns %s", async (type) => {
    const fetchImpl = vi.fn(async () => response(200, type));
    await expect(checkCoverUrl("https://example.com/cover", fetchImpl)).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back to GET when the host does not support HEAD", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(response(405)).mockResolvedValueOnce(response(200, "image/jpeg"));
    await expect(checkCoverUrl("https://example.com/cover.jpg", fetchImpl)).resolves.toEqual({ ok: true });
    expect(fetchImpl.mock.calls[1][1]?.method).toBe("GET");
  });

  it("rejects a link to a web page", async () => {
    const fetchImpl = vi.fn(async () => response(200, "text/html; charset=utf-8"));
    await expect(checkCoverUrl("https://example.com/page", fetchImpl)).resolves.toEqual({ ok: false, reason: COVER_MESSAGES.notImage });
  });

  it("rejects a link that returns 404", async () => {
    const fetchImpl = vi.fn(async () => response(404, "image/jpeg"));
    await expect(checkCoverUrl("https://example.com/missing.jpg", fetchImpl)).resolves.toEqual({
      ok: false,
      reason: COVER_MESSAGES.unreachable,
    });
  });

  it("rejects a link that cannot be reached", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(checkCoverUrl("https://nowhere.invalid/a.jpg", fetchImpl)).resolves.toEqual({
      ok: false,
      reason: COVER_MESSAGES.unreachable,
    });
  });

  it.each(["http://localhost:3000/a.png", "http://127.0.0.1/a.png", "http://192.168.1.10/a.png", "http://10.0.0.1/a.png"])(
    "refuses private address %s without fetching it",
    async (url) => {
      const fetchImpl = vi.fn();
      await expect(checkCoverUrl(url, fetchImpl)).resolves.toEqual({ ok: false, reason: COVER_MESSAGES.privateHost });
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );
});
