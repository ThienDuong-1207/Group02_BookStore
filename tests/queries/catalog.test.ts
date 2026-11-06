import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { listCatalogItems } from "@/lib/queries/catalog";
import { CATALOG, type CatalogKind } from "@/lib/validation/catalog";

function fakeClient(result: { data: unknown; error: unknown }) {
  const calls = { from: vi.fn(), select: vi.fn(), order: vi.fn() };
  const client = {
    from: (table: string) => {
      calls.from(table);
      return {
        select: (columns: string) => {
          calls.select(columns);
          return { order: async (column: string, options: unknown) => (calls.order(column, options), result) };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe.each(Object.keys(CATALOG) as CatalogKind[])("listCatalogItems(%s)", (kind) => {
  it("reads every row, hidden ones included, A → Z", async () => {
    const rows = [{ id: "1", name: "A", is_hidden: true }];
    const { client, calls } = fakeClient({ data: rows, error: null });
    await expect(listCatalogItems(client, kind)).resolves.toEqual(rows);
    expect(calls.from).toHaveBeenCalledWith(CATALOG[kind].table);
    expect(calls.select).toHaveBeenCalledWith("id, name, is_hidden");
    expect(calls.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("throws a database error (the admin page shows the error page)", async () => {
    const { client } = fakeClient({ data: null, error: { message: "boom" } });
    await expect(listCatalogItems(client, kind)).rejects.toEqual({ message: "boom" });
  });
});
