import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-16 (GB-43) M1, M2 + US-13 E3: calls deleteBookAction directly, as someone bypassing the button would.
 * requireAdmin(), the Supabase server client, the Next.js cache and redirect are mocked.
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

const BOOK_ID = "33333333-3333-4333-8333-333333333333";

/** Fake database for one test: is the book still there (not deleted)? did the write fail? */
let db: { exists: boolean; fail: boolean };
const update = vi.fn();
const remove = vi.fn();
const filters: [string, string, unknown][] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      const chain = {
        eq: (column: string, value: unknown) => (filters.push(["eq", column, value]), chain),
        is: (column: string, value: unknown) => (filters.push(["is", column, value]), chain),
        select: async () =>
          db.fail ? { data: null, error: { message: "boom" } } : { data: db.exists ? [{ id: BOOK_ID }] : [], error: null },
      };
      return {
        update: (row: unknown) => (update(table, row), chain),
        delete: () => (remove(table), chain), // must never be used (M2)
      };
    },
  }),
}));

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }));

class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`redirect ${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));

const { deleteBookAction } = await import("@/lib/admin/book-actions");
const { BOOK_MESSAGES } = await import("@/lib/admin/book-messages");
const { ACCESS_MESSAGES } = await import("@/lib/admin/check-admin");
const { MESSAGES } = await import("@/lib/auth/messages");

function form(page?: string) {
  const data = new FormData();
  if (page !== undefined) data.set("page", page);
  return data;
}

/** Runs the action and returns where it redirected to (success) or what it returned (error). */
async function run(id: string, data = form()) {
  try {
    return { result: await deleteBookAction(id, {}, data) };
  } catch (error) {
    if (error instanceof RedirectSignal) return { redirectedTo: error.url };
    throw error;
  }
}

beforeEach(() => {
  caller = "admin";
  db = { exists: true, fail: false };
  filters.length = 0;
  vi.clearAllMocks();
});

describe("US-13 E3 – only admins can delete books", () => {
  it.each([
    ["guest", ACCESS_MESSAGES.notLoggedIn],
    ["customer", ACCESS_MESSAGES.forbidden],
  ] as const)("rejects a %s and changes nothing", async (who, message) => {
    caller = who;
    await expect(run(BOOK_ID)).resolves.toEqual({ result: { formError: message } });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("US-16 M1 – delete hides the book", () => {
  it("sets deleted_at on that book only, if it is not deleted yet", async () => {
    const before = Date.now();
    await run(BOOK_ID);
    expect(update).toHaveBeenCalledTimes(1);
    const [table, row] = update.mock.calls[0];
    expect(table).toBe("books");
    expect(Object.keys(row)).toEqual(["deleted_at"]);
    expect(Date.parse(row.deleted_at)).toBeGreaterThanOrEqual(before);
    expect(filters).toEqual([
      ["eq", "id", BOOK_ID],
      ["is", "deleted_at", null],
    ]);
  });

  it("refreshes the admin list, the customer list and the detail page", async () => {
    await run(BOOK_ID);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/books");
    expect(revalidatePath).toHaveBeenCalledWith("/books");
    expect(revalidatePath).toHaveBeenCalledWith(`/books/${BOOK_ID}`);
  });

  it.each([
    [undefined, "/admin/books?page=1&deleted=1"],
    ["3", "/admin/books?page=3&deleted=1"],
    ["0", "/admin/books?page=1&deleted=1"],
    ["abc", "/admin/books?page=1&deleted=1"],
  ])("goes back to the same list page (page=%s) with the 'Book deleted' message", async (page, url) => {
    await expect(run(BOOK_ID, form(page))).resolves.toEqual({ redirectedTo: url });
  });
});

describe("US-16 M2 – soft delete only", () => {
  it("never removes the row", async () => {
    await run(BOOK_ID);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe("US-16 – book not found", () => {
  it("answers 'Book not found' when the book is unknown or already deleted", async () => {
    db.exists = false;
    await expect(run(BOOK_ID)).resolves.toEqual({ result: { formError: BOOK_MESSAGES.notFound } });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("answers 'Book not found' for a malformed id without querying", async () => {
    await expect(run("not-a-uuid")).resolves.toEqual({ result: { formError: BOOK_MESSAGES.notFound } });
    expect(update).not.toHaveBeenCalled();
  });

  it("shows the generic error when the database fails", async () => {
    db.fail = true;
    await expect(run(BOOK_ID)).resolves.toEqual({ result: { formError: MESSAGES.unexpected } });
  });
});
