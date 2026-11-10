import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listPublicBooks } from "@/lib/queries/book-list";

/**
 * US-20 (GB-47) B2 + US-19 M2/B1: the customer list query is paginated in the database, newest first.
 * US-01 (GB-6): a keyword adds one `ilike` on `search_text` (title + author, folded), also to the count-only query.
 */

type Result = { data: unknown; error: unknown; count: number | null };

function fakeClient(result: Result, headCount = 0) {
  const calls: {
    table?: string;
    columns?: string;
    options?: unknown;
    order: unknown[];
    range?: [number, number];
    ilike: [string, string][];
    headIlike: [string, string][];
  } = { order: [], ilike: [], headIlike: [] };
  // The count-only query (head: true) is awaited after its filters, so it is a "thenable" builder of its own.
  const head = {
    ilike: vi.fn((column: string, pattern: string) => (calls.headIlike.push([column, pattern]), head)),
    then: (resolve: (value: unknown) => void) => resolve({ count: headCount, error: null }),
  };
  const builder = {
    select: vi.fn((columns: string, options?: { head?: boolean }) => {
      calls.columns ??= columns;
      calls.options ??= options;
      if (options?.head) return head;
      return builder;
    }),
    ilike: vi.fn((column: string, pattern: string) => (calls.ilike.push([column, pattern]), builder)),
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

  it("without a keyword it adds no search filter (US-01 AC3: full list)", async () => {
    const { client, calls } = fakeClient({ data: [], error: null, count: 0 });
    await listPublicBooks(client, 1, { q: "   " });
    expect(calls.ilike).toEqual([]);
  });

  it("US-01 AC1: searches title + author in one folded column, accent-insensitive", async () => {
    const { client, calls } = fakeClient({ data: [{ id: "b1" }], error: null, count: 1 });
    await expect(listPublicBooks(client, 1, { q: "Nguyễn" })).resolves.toEqual({ books: [{ id: "b1" }], total: 1 });
    expect(calls.table).toBe("books_public");
    expect(calls.ilike).toEqual([["search_text", "%nguyen%"]]);
    expect(calls.range).toEqual([0, 11]);
  });

  it("US-01 B2: wildcards in the keyword are escaped", async () => {
    const { client, calls } = fakeClient({ data: [], error: null, count: 0 });
    await listPublicBooks(client, 1, { q: "100%_off" });
    expect(calls.ilike).toEqual([["search_text", "%100\\%\\_off%"]]);
  });

  it("US-01 + E1: the count-only fallback uses the same search, so the last page is the last page of the results", async () => {
    const { client, calls } = fakeClient({ data: null, error: { code: "PGRST103" }, count: null }, 14);
    await expect(listPublicBooks(client, 5, { q: "harry" })).resolves.toEqual({ books: [], total: 14 });
    expect(calls.headIlike).toEqual([["search_text", "%harry%"]]);
  });

  it("throws other database errors", async () => {
    const { client } = fakeClient({ data: null, error: { code: "42P01", message: "missing" }, count: null });
    await expect(listPublicBooks(client, 1)).rejects.toMatchObject({ code: "42P01" });
  });
});
