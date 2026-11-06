import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-17 (GB-44) / US-18 (GB-45) M1, E1, E2, B1 + US-13 E3: calls the category / author actions directly,
 * as someone bypassing the forms would. requireAdmin(), the Supabase server client and the Next.js cache are mocked.
 * Every test runs for each kind in CATALOG.
 */

let caller: "admin" | "customer" | "guest" = "admin";
vi.mock("@/lib/auth/profile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/profile")>("@/lib/auth/profile");
  return {
    ...actual,
    requireAdmin: async () => {
      if (caller === "guest") throw new actual.AuthorizationError(401);
      if (caller === "customer") throw new actual.AuthorizationError(403);
      return { id: "admin-1", email: "admin@bookstore.demo", full_name: "Demo Admin", role: "ADMIN", status: "ACTIVE" };
    },
  };
});

const ITEM_ID = "22222222-2222-4222-8222-222222222222";

/** Fake database for one test. */
let db: {
  writeError: { code: string } | null; // error returned by insert / update
  found: boolean; // does the item exist (update returns a row)?
  bookCount: number; // books (not deleted) using the item
  name: string; // name returned by update … select("name")
};
const calls: string[] = [];
const writes: { table: string; op: string; row: unknown }[] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      const chain = {
        eq: (column: string, value: unknown) => (calls.push(`${table}.eq ${column}=${value}`), chain),
        is: (column: string, value: unknown) => {
          calls.push(`${table}.is ${column}=${value}`);
          // end of the count query on books
          return Promise.resolve({ count: db.bookCount, error: null });
        },
        select: async () =>
          db.writeError ? { data: null, error: db.writeError } : { data: db.found ? [{ id: ITEM_ID, name: db.name }] : [], error: null },
      };
      return {
        insert: async (row: unknown) => (writes.push({ table, op: "insert", row }), { error: db.writeError }),
        update: (row: unknown) => (writes.push({ table, op: "update", row }), chain),
        // count query: from("books").select("id", { count, head }).eq(column, id).is("deleted_at", null)
        select: (_columns: string, options?: unknown) => (calls.push(`${table}.select ${JSON.stringify(options)}`), chain),
      };
    },
  }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));

const { createCatalogItemAction, renameCatalogItemAction, setCatalogItemHiddenAction } = await import("@/lib/admin/catalog-actions");
const { CATALOG } = await import("@/lib/validation/catalog");
const { ACCESS_MESSAGES } = await import("@/lib/admin/check-admin");
const { MESSAGES } = await import("@/lib/auth/messages");

type Kind = keyof typeof CATALOG;
const kinds = Object.keys(CATALOG) as Kind[];

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
const hide = form({ hidden: "true" });
const show = form({ hidden: "false" });

beforeEach(() => {
  caller = "admin";
  db = { writeError: null, found: true, bookCount: 0, name: "Science" };
  calls.length = 0;
  writes.length = 0;
  vi.clearAllMocks();
});

describe.each(kinds)("%s", (kind) => {
  const { table, bookColumn, path, maxLength, messages } = CATALOG[kind];

  describe("US-13 E3 – only admins", () => {
    it.each([
      ["guest", ACCESS_MESSAGES.notLoggedIn],
      ["customer", ACCESS_MESSAGES.forbidden],
    ] as const)("rejects a %s for add, rename and hide, and writes nothing", async (who, message) => {
      caller = who;
      await expect(createCatalogItemAction(kind, {}, form({ name: "Science" }))).resolves.toEqual({ formError: message });
      await expect(renameCatalogItemAction(kind, ITEM_ID, {}, form({ name: "Science" }))).resolves.toEqual({ formError: message });
      await expect(setCatalogItemHiddenAction(kind, ITEM_ID, {}, hide)).resolves.toEqual({ formError: message });
      expect(writes).toHaveLength(0);
    });
  });

  describe("M1 – add", () => {
    it("inserts the trimmed name and refreshes the admin page and the site", async () => {
      await expect(createCatalogItemAction(kind, {}, form({ name: "  Science  " }))).resolves.toEqual({
        success: messages.added("Science"),
      });
      expect(writes).toEqual([{ table, op: "insert", row: { name: "Science" } }]);
      expect(revalidatePath).toHaveBeenCalledWith(path);
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
    });
  });

  describe("E1 – duplicate name (case-insensitive unique index)", () => {
    it("shows the 'already exists' message on add", async () => {
      db.writeError = { code: "23505" };
      await expect(createCatalogItemAction(kind, {}, form({ name: "science" }))).resolves.toEqual({
        fieldErrors: { name: messages.exists },
      });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it("shows the 'already exists' message on rename", async () => {
      db.writeError = { code: "23505" };
      await expect(renameCatalogItemAction(kind, ITEM_ID, {}, form({ name: "SCIENCE" }))).resolves.toEqual({
        fieldErrors: { name: messages.exists },
      });
    });

    it("shows the generic error for any other database error", async () => {
      db.writeError = { code: "XX000" };
      await expect(createCatalogItemAction(kind, {}, form({ name: "Science" }))).resolves.toEqual({
        formError: MESSAGES.unexpected,
      });
    });
  });

  describe("B1 – name rules on the server", () => {
    it.each([
      ["empty", ""],
      ["whitespace only", "    "],
      ["too long", "a".repeat(maxLength + 1)],
    ])("rejects a %s name on add and rename, and writes nothing", async (_label, name) => {
      const added = await createCatalogItemAction(kind, {}, form({ name }));
      const renamed = await renameCatalogItemAction(kind, ITEM_ID, {}, form({ name }));
      expect(added.fieldErrors?.name).toBeTruthy();
      expect(renamed.fieldErrors?.name).toBeTruthy();
      expect(writes).toHaveLength(0);
    });
  });

  describe("M1 – rename", () => {
    it("updates the name of that item only", async () => {
      await expect(renameCatalogItemAction(kind, ITEM_ID, {}, form({ name: " New name " }))).resolves.toEqual({
        success: messages.renamed("New name"),
      });
      expect(writes).toEqual([{ table, op: "update", row: { name: "New name" } }]);
      expect(calls).toContain(`${table}.eq id=${ITEM_ID}`);
    });

    it("answers 'not found' for an unknown id", async () => {
      db.found = false;
      await expect(renameCatalogItemAction(kind, ITEM_ID, {}, form({ name: "Science" }))).resolves.toEqual({
        formError: messages.notFound,
      });
    });

    it("answers 'not found' for a malformed id without querying", async () => {
      await expect(renameCatalogItemAction(kind, "x", {}, form({ name: "Science" }))).resolves.toEqual({
        formError: messages.notFound,
      });
      expect(writes).toHaveLength(0);
    });
  });

  describe("M1 / E2 – hide and show", () => {
    it("hides an item that has no books", async () => {
      db.name = "Old category";
      await expect(setCatalogItemHiddenAction(kind, ITEM_ID, {}, hide)).resolves.toEqual({
        success: messages.hidden("Old category"),
      });
      expect(writes).toEqual([{ table, op: "update", row: { is_hidden: true } }]);
    });

    it("counts only books that are not deleted, without loading them", async () => {
      await setCatalogItemHiddenAction(kind, ITEM_ID, {}, hide);
      expect(calls).toContain(`books.select ${JSON.stringify({ count: "exact", head: true })}`);
      expect(calls).toContain(`books.eq ${bookColumn}=${ITEM_ID}`);
      expect(calls).toContain("books.is deleted_at=null");
    });

    it.each([
      [1, "1 book"],
      [3, "3 books"],
    ])("E2: blocks hiding while %i book(s) still use it", async (count, text) => {
      db.bookCount = count;
      await expect(setCatalogItemHiddenAction(kind, ITEM_ID, {}, hide)).resolves.toEqual({
        formError: `${messages.inUse} (${text}).`,
      });
      expect(writes).toHaveLength(0);
    });

    it("shows a hidden item again without checking books", async () => {
      db.bookCount = 5;
      await expect(setCatalogItemHiddenAction(kind, ITEM_ID, {}, show)).resolves.toEqual({
        success: messages.shown("Science"),
      });
      expect(writes).toEqual([{ table, op: "update", row: { is_hidden: false } }]);
      expect(calls.some((call) => call.startsWith("books."))).toBe(false);
    });

    it.each([["missing", form({})], ["invalid", form({ hidden: "yes" })]])(
      "rejects a %s hidden value",
      async (_label, data) => {
        await expect(setCatalogItemHiddenAction(kind, ITEM_ID, {}, data)).resolves.toEqual({ formError: MESSAGES.unexpected });
        expect(writes).toHaveLength(0);
      },
    );

    it("answers 'not found' for an unknown id", async () => {
      db.found = false;
      await expect(setCatalogItemHiddenAction(kind, ITEM_ID, {}, show)).resolves.toEqual({ formError: messages.notFound });
    });
  });
});

describe("unknown kind", () => {
  it("is rejected before any write (the kind is bound in the browser)", async () => {
    await expect(createCatalogItemAction("books", {}, form({ name: "x" }))).resolves.toEqual({ formError: MESSAGES.unexpected });
    await expect(renameCatalogItemAction("profiles", ITEM_ID, {}, form({ name: "x" }))).resolves.toEqual({
      formError: MESSAGES.unexpected,
    });
    await expect(setCatalogItemHiddenAction("books", ITEM_ID, {}, hide)).resolves.toEqual({ formError: MESSAGES.unexpected });
    expect(writes).toHaveLength(0);
  });
});
