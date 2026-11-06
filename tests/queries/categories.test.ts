import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { categoryHref, listMenuCategories } from "@/lib/queries/categories";

function fakeClient(result: { data: unknown; error: unknown }) {
  const calls = { select: vi.fn(), eq: vi.fn(), order: vi.fn() };
  const client = {
    from: () => ({
      select: (columns: string) => {
        calls.select(columns);
        return {
          eq: (column: string, value: unknown) => {
            calls.eq(column, value);
            return {
              order: async (column: string, options: unknown) => (calls.order(column, options), result),
            };
          },
        };
      },
    }),
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe("listMenuCategories (US-29 header menu)", () => {
  it("returns visible categories sorted by name", async () => {
    const rows = [{ id: "1", name: "Fiction" }];
    const { client, calls } = fakeClient({ data: rows, error: null });
    await expect(listMenuCategories(client)).resolves.toEqual(rows);
    expect(calls.select).toHaveBeenCalledWith("id, name");
    expect(calls.eq).toHaveBeenCalledWith("is_hidden", false);
    expect(calls.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("returns an empty list on a query error", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } });
    await expect(listMenuCategories(client)).resolves.toEqual([]);
  });
});

describe("categoryHref", () => {
  it("links to the book list filtered by category, URL-encoded", () => {
    expect(categoryHref("a b&c")).toBe("/books?category=a%20b%26c");
  });
});
