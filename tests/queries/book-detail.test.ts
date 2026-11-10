import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { getPublicBook } from "@/lib/queries/book-detail";

/** US-02 / US-22 E1: the detail page reads one book from `books_public` (deleted / hidden books are not there). */
const ID = "33333333-3333-4333-8333-333333333333";

function fakeClient(result: { data: unknown; error: unknown }) {
  const calls = { from: vi.fn(), select: vi.fn(), eq: vi.fn() };
  const client = {
    from: (table: string) => {
      calls.from(table);
      const builder = {
        select: (columns: string) => (calls.select(columns), builder),
        eq: (column: string, value: unknown) => (calls.eq(column, value), builder),
        maybeSingle: async () => result,
      };
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe("getPublicBook (US-02)", () => {
  it("reads every field of the detail page from books_public by id", async () => {
    const row = { id: ID, title: "Clean Code" };
    const { client, calls } = fakeClient({ data: row, error: null });
    await expect(getPublicBook(client, ID)).resolves.toEqual(row);
    expect(calls.from).toHaveBeenCalledWith("books_public");
    expect(calls.select).toHaveBeenCalledWith(
      "id, title, description, price, stock, cover_url, author_name, category_id, category_name",
    );
    expect(calls.eq).toHaveBeenCalledWith("id", ID);
  });

  it("returns null for an unknown, deleted or hidden book (no row in the view)", async () => {
    const { client } = fakeClient({ data: null, error: null });
    await expect(getPublicBook(client, ID)).resolves.toBeNull();
  });

  it.each(["abc", "1", "33333333-3333-4333-8333-33333333333z", "' or 1=1 --"])(
    "returns null for the malformed id %j without querying",
    async (id) => {
      const { client, calls } = fakeClient({ data: null, error: null });
      await expect(getPublicBook(client, id)).resolves.toBeNull();
      expect(calls.from).not.toHaveBeenCalled();
    },
  );

  it("throws a real database error (shown as the error page, not as 'not found')", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } });
    await expect(getPublicBook(client, ID)).rejects.toEqual({ message: "boom" });
  });
});
