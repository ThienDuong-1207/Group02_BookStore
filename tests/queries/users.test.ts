import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDate, listUsers } from "@/lib/queries/users";

/** US-14 M1: the admin user list query and the created-date format. */

function fakeClient(result: { data: unknown; error: unknown }) {
  const calls: { table?: string; columns?: string; order: [string, { ascending: boolean }][] } = { order: [] };
  const builder = {
    select: vi.fn((columns: string) => {
      calls.columns = columns;
      return builder;
    }),
    order: vi.fn((column: string, options: { ascending: boolean }) => {
      calls.order.push([column, options]);
      return calls.order.length === 2 ? Promise.resolve(result) : builder;
    }),
  };
  const client = {
    from: (table: string) => {
      calls.table = table;
      return builder;
    },
  } as unknown as SupabaseClient;
  return { client, calls };
}

describe("US-14 M1 – listUsers", () => {
  it("reads name, email, role, status and created date from profiles, newest first", async () => {
    const rows = [
      { id: "2", email: "b@example.com", full_name: "B", role: "CUSTOMER", status: "ACTIVE", created_at: "2026-10-29T03:00:00Z" },
      { id: "1", email: "a@example.com", full_name: "A", role: "ADMIN", status: "LOCKED", created_at: "2026-10-28T03:00:00Z" },
    ];
    const { client, calls } = fakeClient({ data: rows, error: null });

    await expect(listUsers(client)).resolves.toEqual(rows);
    expect(calls.table).toBe("profiles");
    expect(calls.columns).toBe("id, email, full_name, role, status, created_at");
    expect(calls.order).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
  });

  it("returns an empty list when there are no rows", async () => {
    const { client } = fakeClient({ data: null, error: null });
    await expect(listUsers(client)).resolves.toEqual([]);
  });

  it("throws when the database returns an error", async () => {
    const { client } = fakeClient({ data: null, error: new Error("permission denied") });
    await expect(listUsers(client)).rejects.toThrow("permission denied");
  });
});

describe("US-14 M1 – formatDate", () => {
  it("shows dd/mm/yyyy in Vietnam time", () => {
    expect(formatDate("2026-10-29T03:00:00Z")).toBe("29/10/2026");
    // 17:30 UTC on the 29th is already 00:30 on the 30th in Vietnam (UTC+7)
    expect(formatDate("2026-10-29T17:30:00Z")).toBe("30/10/2026");
  });
});
