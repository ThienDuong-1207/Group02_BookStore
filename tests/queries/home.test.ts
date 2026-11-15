import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { listOnSaleBooks } from "@/lib/queries/home";

/** Home page "On sale today": active promotions (CR-02 dates included) joined with the visible books. */

type Result = { data: unknown; error: unknown };

function fakeClient(promotions: Result, books: Result) {
  const calls = { lte: vi.fn(), gte: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(), tables: [] as string[] };
  const client = {
    from: (table: string) => {
      calls.tables.push(table);
      if (table === "promotions") {
        const query = {
          select: () => query,
          lte: (column: string, value: string) => (calls.lte(column, value), query),
          gte: (column: string, value: string) => (calls.gte(column, value), query),
          order: (column: string, options: unknown) => (calls.order(column, options), query),
          limit: async (count: number) => (calls.limit(count), promotions),
        };
        return query;
      }
      return { select: () => ({ in: async (column: string, ids: string[]) => (calls.in(column, ids), books) }) };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

const book = (id: string, price: number) => ({ id, title: `Book ${id}`, price, stock: 3, cover_url: null, author_name: "A", category_name: "C", created_at: "2026-11-01T00:00:00Z" });
const promo = (book_id: string, discount_percent: number) => ({ book_id, discount_percent, start_date: "2026-11-01", end_date: "2026-11-30" });

describe("listOnSaleBooks", () => {
  it("asks for promotions active today (start ≤ today ≤ end), biggest discount first", async () => {
    const { client, calls } = fakeClient({ data: [promo("a", 30)], error: null }, { data: [book("a", 100000)], error: null });
    await listOnSaleBooks(client, "2026-11-11", 4);
    expect(calls.lte).toHaveBeenCalledWith("start_date", "2026-11-11");
    expect(calls.gte).toHaveBeenCalledWith("end_date", "2026-11-11");
    expect(calls.order).toHaveBeenCalledWith("discount_percent", { ascending: false });
    expect(calls.tables).toEqual(["promotions", "books_public"]); // customers only ever read the public view
    expect(calls.in).toHaveBeenCalledWith("id", ["a"]);
  });

  it("returns the books in promotion order with the US-26 price", async () => {
    const { client } = fakeClient(
      { data: [promo("a", 30), promo("b", 10)], error: null },
      { data: [book("b", 200000), book("a", 100000)], error: null },
    );
    const result = await listOnSaleBooks(client, "2026-11-11", 4);
    expect(result.map((item) => item.id)).toEqual(["a", "b"]);
    expect(result[0].pricing).toEqual({ price: 70000, originalPrice: 100000, discountPercent: 30 });
    expect(result[1].pricing).toEqual({ price: 180000, originalPrice: 200000, discountPercent: 10 });
  });

  it("skips promotions whose book is hidden or soft-deleted (not in books_public)", async () => {
    const { client } = fakeClient({ data: [promo("gone", 50), promo("a", 20)], error: null }, { data: [book("a", 100000)], error: null });
    const result = await listOnSaleBooks(client, "2026-11-11", 4);
    expect(result.map((item) => item.id)).toEqual(["a"]);
  });

  it("keeps at most `limit` books", async () => {
    const ids = ["a", "b", "c"];
    const { client } = fakeClient({ data: ids.map((id) => promo(id, 20)), error: null }, { data: ids.map((id) => book(id, 100000)), error: null });
    expect(await listOnSaleBooks(client, "2026-11-11", 2)).toHaveLength(2);
  });

  it("no active promotion → empty list, and the books are not queried", async () => {
    const { client, calls } = fakeClient({ data: [], error: null }, { data: [], error: null });
    expect(await listOnSaleBooks(client, "2026-11-11")).toEqual([]);
    expect(calls.tables).toEqual(["promotions"]);
  });

  it("throws database errors (the home page catches them and hides the section)", async () => {
    const failing = fakeClient({ data: null, error: { message: "boom" } }, { data: [], error: null });
    await expect(listOnSaleBooks(failing.client, "2026-11-11")).rejects.toEqual({ message: "boom" });
    const failingBooks = fakeClient({ data: [promo("a", 20)], error: null }, { data: null, error: { message: "books" } });
    await expect(listOnSaleBooks(failingBooks.client, "2026-11-11")).rejects.toEqual({ message: "books" });
  });
});
