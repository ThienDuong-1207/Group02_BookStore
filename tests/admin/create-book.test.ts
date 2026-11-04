import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-05 (GB-10) M1, E1, AC3, B1–B4 + US-13 E3: calls createBookAction directly, as someone bypassing the form would.
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

const insert = vi.fn();
let visible = { authors: true, categories: true };
let insertError: unknown = null;
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: "authors" | "categories" | "books") => {
      if (table === "books") {
        return { insert: async (row: unknown) => (insert(row), { error: insertError }) };
      }
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => ({ data: visible[table] ? { id: "x" } : null, error: null }),
      };
      return builder;
    },
  }),
}));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }));

const { createBookAction } = await import("@/lib/admin/book-actions");
const { BOOK_MESSAGES } = await import("@/lib/admin/book-messages");
const { ACCESS_MESSAGES } = await import("@/lib/admin/check-admin");
const { COVER_MESSAGES } = await import("@/lib/books/cover-check");
const { MESSAGES } = await import("@/lib/auth/messages");

const valid = {
  title: "Clean Code",
  authorId: "11111111-1111-4111-8111-111111111111",
  categoryId: "22222222-2222-4222-8222-222222222222",
  price: "120000",
  stock: "5",
  description: "A handbook of agile software craftsmanship.",
  coverUrl: "https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg",
};
function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  caller = "admin";
  visible = { authors: true, categories: true };
  insertError = null;
  vi.clearAllMocks();
  checkCoverUrl.mockResolvedValue({ ok: true });
});

describe("US-13 E3 – only admins can add books", () => {
  it.each([
    ["guest", ACCESS_MESSAGES.notLoggedIn],
    ["customer", ACCESS_MESSAGES.forbidden],
  ] as const)("rejects a %s and saves nothing", async (who, message) => {
    caller = who;
    await expect(createBookAction({}, form(valid))).resolves.toEqual({ formError: message });
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("US-05 M1/M2 – add a book", () => {
  it("saves the book, refreshes both lists and says 'Book added'", async () => {
    await expect(createBookAction({}, form(valid))).resolves.toEqual({ success: BOOK_MESSAGES.added });
    expect(insert).toHaveBeenCalledWith({
      title: "Clean Code",
      author_id: valid.authorId,
      category_id: valid.categoryId,
      price: 120000,
      stock: 5,
      description: valid.description,
      cover_url: valid.coverUrl,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/books");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/books");
  });

  it("saves a book without a cover and skips the cover check", async () => {
    await createBookAction({}, form({ ...valid, coverUrl: "" }));
    expect(checkCoverUrl).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ cover_url: null }));
  });

  it("shows a general error if the database refuses the insert", async () => {
    insertError = { message: "rls" };
    await expect(createBookAction({}, form(valid))).resolves.toEqual({ formError: MESSAGES.unexpected });
  });
});

describe("US-05 E1 / B1–B4 – the server re-validates (form bypassed)", () => {
  it.each([
    ["empty title", { title: "" }, "title"],
    ["missing author", { authorId: "" }, "authorId"],
    ["missing category", { categoryId: "" }, "categoryId"],
    ["price 0", { price: "0" }, "price"],
    ["negative price", { price: "-1" }, "price"],
    ["non-numeric price", { price: "abc" }, "price"],
    ["negative stock", { stock: "-1" }, "stock"],
    ["empty description", { description: "  " }, "description"],
    ["invalid cover link", { coverUrl: "not-a-url" }, "coverUrl"],
  ])("rejects %s and saves nothing", async (_label, change, field) => {
    const result = await createBookAction({}, form({ ...valid, ...change }));
    expect(result.fieldErrors?.[field]).toBeTruthy();
    expect(insert).not.toHaveBeenCalled();
  });

  it("accepts price 1 and stock 0 (boundaries)", async () => {
    await expect(createBookAction({}, form({ ...valid, price: "1", stock: "0" }))).resolves.toEqual({ success: BOOK_MESSAGES.added });
  });
});

describe("US-05 AC3 – cover link must be an image", () => {
  it("rejects a link that is not an image and saves nothing", async () => {
    checkCoverUrl.mockResolvedValue({ ok: false, reason: COVER_MESSAGES.notImage });
    const result = await createBookAction({}, form({ ...valid, coverUrl: "https://example.com/page.html" }));
    expect(result.fieldErrors?.coverUrl).toBe(COVER_MESSAGES.notImage);
    expect(insert).not.toHaveBeenCalled();
  });
});

describe("hidden or unknown author / category", () => {
  it("rejects an author that is hidden or does not exist", async () => {
    visible.authors = false;
    const result = await createBookAction({}, form(valid));
    expect(result.fieldErrors?.authorId).toBe(BOOK_MESSAGES.authorUnavailable);
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects a category that is hidden or does not exist", async () => {
    visible.categories = false;
    const result = await createBookAction({}, form(valid));
    expect(result.fieldErrors?.categoryId).toBe(BOOK_MESSAGES.categoryUnavailable);
  });
});
