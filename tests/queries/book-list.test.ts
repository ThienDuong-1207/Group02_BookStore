import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listPublicBooks } from "@/lib/queries/book-list";

/** US-20 (GB-47) B2 + US-19 M2/B1: the customer list query is paginated in the database, newest first. */

type Result = { data: unknown; error: unknown; count: number | null };

function fakeClient(result: Result, headCount = 0) {
  const calls: { table?: string; columns?: string; options?: unknown; order: unknown[]; range?: [number, number] } = { order: [] };
  const builder = {
    select: vi.fn((columns: string, options?: { head?: boolean }) => {
      calls.columns ??= columns;
      calls.options ??= options;
      if (options?.head) return Promise.resolve({ count: headCount, error: null });
      return builder;
    }),
    order: vi.fn((column: string, options: unknown) => (calls.order.push([column, options]), builder)),
    range: vi.fn(async (from: number, to: number) => ((calls.range = [from, to]), result)),
  };
  const client = { from: (table: string) => ((calls.table = table), builder) } as unknown as SupabaseClient;
  return { client, calls, builder };
}

describe("listPublicBooks", () => {
  it("reads books_public, newest first, rows 12–23 for page 2, with an exact count", async () => {
    const rows = [{ id: "b13" }];
    const { client, calls } = fakeClient({ data: rows, error: null, count: 30 });

    await expect(listPublicBooks(client, 2)).resolves.toEqual({ books: rows, total: 30 });
    expect(calls.table).toBe("books_public");
    expect(calls.options).toEqual({ count: "exact" });
    expect(calls.order).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    expect(calls.range).toEqual([12, 23]);
  });

  it("returns an empty first page when there are no books", async () => {
    const { client } = fakeClient({ data: [], error: null, count: 0 });
    await expect(listPublicBooks(client, 1)).resolves.toEqual({ books: [], total: 0 });
  });

  it("E1: a page past the end returns no books but the real total (to redirect to the last page)", async () => {
    const { client } = fakeClient({ data: null, error: { code: "PGRST103" }, count: null }, 30);
    await expect(listPublicBooks(client, 9)).resolves.toEqual({ books: [], total: 30 });
  });

  it("throws other database errors", async () => {
    const { client } = fakeClient({ data: null, error: { code: "42P01", message: "missing" }, count: null });
    await expect(listPublicBooks(client, 1)).rejects.toMatchObject({ code: "42P01" });
  });
});
