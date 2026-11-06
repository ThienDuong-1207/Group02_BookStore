import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { isUuid, listAdminBooks } from "@/lib/queries/books";

/** Fake client: the page query answers `page`, the count-only query answers `count`. Records the filters used. */
function fakeClient(page: { data: unknown; error: unknown; count: number | null }, count = 0) {
  const calls: string[] = [];
  const client = {
    from: () => ({
      select: (_columns: string, options?: { head?: boolean }) => {
        const chain = {
          is: (column: string, value: unknown) => (calls.push(`is ${column} ${value}`), options?.head ? { count, error: null } : chain),
          order: () => chain,
          range: async () => page,
        };
        return chain;
      },
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe("listAdminBooks (US-16)", () => {
  it("lists only books that are not deleted", async () => {
    const { client, calls } = fakeClient({ data: [], error: null, count: 0 });
    await listAdminBooks(client, 1);
    expect(calls).toEqual(["is deleted_at null"]);
  });

  it("returns no rows but the real total for a page past the end (PGRST103)", async () => {
    const { client, calls } = fakeClient({ data: null, error: { code: "PGRST103" }, count: null }, 20);
    await expect(listAdminBooks(client, 2)).resolves.toEqual({ rows: [], total: 20 });
    expect(calls).toEqual(["is deleted_at null", "is deleted_at null"]);
  });

  it("still throws any other database error", async () => {
    const { client } = fakeClient({ data: null, error: { code: "XX000" }, count: null });
    await expect(listAdminBooks(client, 1)).rejects.toEqual({ code: "XX000" });
  });
});

describe("isUuid", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(isUuid("33333333-3333-4333-8333-333333333333")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("33333333-3333-4333-8333-33333333333")).toBe(false);
  });
});
