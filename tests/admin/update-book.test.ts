import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-15 (GB-42) M1, E1, E2 / AC3 + US-13 E3: calls updateBookAction directly.
 * requireAdmin(), the Supabase server client, the cover check and the Next.js cache are mocked.
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

const checkCoverUrl = vi.fn();
vi.mock("@/lib/books/cover-check", async () => {
  const actual = await vi.importActual<typeof import("@/lib/books/cover-check")>("@/lib/books/cover-check");
  return { ...actual, checkCoverUrl: (url: string) => checkCoverUrl(url) };
});

const BOOK_ID = "33333333-3333-4333-8333-333333333333";
const stored = {
  id: BOOK_ID,
  title: "Clean Code",
  author_id: "11111111-1111-4111-8111-111111111111",
  category_id: "22222222-2222-4222-8222-222222222222",
  price: 120000,
  stock: 5,
  description: "A handbook of agile software craftsmanship.",
  cover_url: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
};

/** State of the fake database for one test. */
let db: { book: typeof stored | null; deletedBeforeSave: boolean };
const update = vi.fn();
const filters: [string, string, unknown][] = [];

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: (column: string, value: unknown) => (filters.push(["eq", column, value]), builder),
        is: (column: string, value: unknown) => (filters.push(["is", column, value]), builder),
        // read: the edit check (books) or the author / category check
        maybeSingle: async () => ({ data: table === "books" ? db.book : { id: "x" }, error: null }),
        update: (row: unknown) => {
          update(row);
          return {
            eq: () => ({
              is: () => ({ select: async () => ({ data: db.deletedBeforeSave ? [] : [{ id: BOOK_ID }], error: null }) }),
            }),
          };
        },
      };
      return builder;
    },
  }),
}));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }));

const { updateBookAction } = await import("@/lib/admin/book-actions");
const { BOOK_MESSAGES } = await import("@/lib/admin/book-messages");
const { ACCESS_MESSAGES } = await import("@/lib/admin/check-admin");

const valid = {
  title: "Clean Code (2nd edition)",
  authorId: stored.author_id,
  categoryId: stored.category_id,
  price: "150000",
  stock: "0",
  description: stored.description,
  coverUrl: stored.cover_url,
};
function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  caller = "admin";
  db = { book: { ...stored }, deletedBeforeSave: false };
  filters.length = 0;
  vi.clearAllMocks();
  checkCoverUrl.mockResolvedValue({ ok: true });
});

describe("US-13 E3 – only admins can edit books", () => {
  it.each([
    ["guest", ACCESS_MESSAGES.notLoggedIn],
    ["customer", ACCESS_MESSAGES.forbidden],
  ] as const)("rejects a %s and changes nothing", async (who, message) => {
    caller = who;
    await expect(updateBookAction(BOOK_ID, {}, form(valid))).resolves.toEqual({ formError: message });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("US-15 M1 – save changes", () => {
  it("updates the book and refreshes the admin list, customer list and detail page", async () => {
    await expect(updateBookAction(BOOK_ID, {}, form(valid))).resolves.toEqual({ success: BOOK_MESSAGES.saved });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ title: "Clean Code (2nd edition)", price: 150000, stock: 0 }));
    expect(revalidatePath).toHaveBeenCalledWith("/admin/books");
    expect(revalidatePath).toHaveBeenCalledWith("/books");
    expect(revalidatePath).toHaveBeenCalledWith(`/books/${BOOK_ID}`);
  });

  it("only reads books that are not deleted", async () => {
    await updateBookAction(BOOK_ID, {}, form(valid));
    expect(filters).toContainEqual(["is", "deleted_at", null]);
  });

  it("does not re-check an unchanged cover link", async () => {
    await updateBookAction(BOOK_ID, {}, form(valid));
    expect(checkCoverUrl).not.toHaveBeenCalled();
  });

  it("checks a new cover link", async () => {
    await updateBookAction(BOOK_ID, {}, form({ ...valid, coverUrl: "https://example.com/new.png" }));
    expect(checkCoverUrl).toHaveBeenCalledWith("https://example.com/new.png");
  });
});

describe("US-15 E1 – same validation as US-05", () => {
  it.each([
    ["price 0", { price: "0" }, "price"],
    ["negative stock", { stock: "-1" }, "stock"],
    ["empty title", { title: "" }, "title"],
    ["invalid cover link", { coverUrl: "abc" }, "coverUrl"],
  ])("rejects %s and saves nothing", async (_label, change, field) => {
    const result = await updateBookAction(BOOK_ID, {}, form({ ...valid, ...change }));
    expect(result.fieldErrors?.[field]).toBeTruthy();
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a new cover link that is not an image", async () => {
    checkCoverUrl.mockResolvedValue({ ok: false, reason: "not an image" });
    const result = await updateBookAction(BOOK_ID, {}, form({ ...valid, coverUrl: "https://example.com/page" }));
    expect(result.fieldErrors?.coverUrl).toBe("not an image");
    expect(update).not.toHaveBeenCalled();
  });
});

describe("US-15 E2 / AC3 – book not found", () => {
  it("shows 'Book not found' for a deleted or unknown book", async () => {
    db.book = null;
    await expect(updateBookAction(BOOK_ID, {}, form(valid))).resolves.toEqual({ formError: BOOK_MESSAGES.notFound });
    expect(update).not.toHaveBeenCalled();
  });

  it("shows 'Book not found' when another admin deletes it while the form is open", async () => {
    db.deletedBeforeSave = true;
    await expect(updateBookAction(BOOK_ID, {}, form(valid))).resolves.toEqual({ formError: BOOK_MESSAGES.notFound });
  });

  it("shows 'Book not found' for a malformed id without querying", async () => {
    await expect(updateBookAction("not-a-uuid", {}, form(valid))).resolves.toEqual({ formError: BOOK_MESSAGES.notFound });
    expect(filters).toHaveLength(0);
  });
});
