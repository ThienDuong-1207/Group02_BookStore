import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AdminBookRow } from "@/lib/queries/books";
import type { UserRow } from "@/lib/queries/users";

/**
 * US-21 AC3 (task 3.3.8, DEF-07): admin pages are usable on a tablet.
 * Below 1024 px the book and user lists are cards (1 column on phones, 2 on tablets); the table only appears from
 * 1024 px, and its box scrolls inside itself instead of cutting off columns. The admin layout puts the menu above the
 * content below 1024 px. Classes are checked here; widths are checked by hand (docs/test-cases/F3.md TC-F3-45…50).
 */

vi.mock("@/lib/admin/user-actions", () => ({ setUserStatusAction: async () => ({}) }));
vi.mock("@/lib/auth/profile", () => ({
  requireAdmin: async () => ({ id: "a" }),
  AuthorizationError: class extends Error {},
}));

const { BookList } = await import("@/components/admin/BookList");
const { UserList } = await import("@/components/admin/UserList");
const { default: AdminLayout } = await import("@/app/admin/layout");

const book: AdminBookRow = {
  id: "b1",
  title: "A rather long book title that used to push the table out of the screen",
  price: 120000,
  stock: 0,
  created_at: "2026-11-01T00:00:00Z",
  author_name: "Nguyễn Nhật Ánh",
  category_name: "Văn học",
};
const user: UserRow = {
  id: "u1",
  email: "customer@bookstore.demo",
  full_name: "Demo Customer",
  role: "CUSTOMER",
  status: "ACTIVE",
  created_at: "2026-11-01T00:00:00Z",
};

describe("Admin book list (US-21 AC3 / DEF-07)", () => {
  const html = renderToStaticMarkup(
    createElement(BookList, { books: [book], actions: () => createElement("button", null, "Edit") }),
  );

  it("cards below 1024 px: 1 column on phones, 2 on tablets", () => {
    expect(html).toContain('class="mt-6 grid gap-3 md:grid-cols-2 lg:hidden"');
  });

  it("table only from 1024 px, scrolling inside its own box (never clipped)", () => {
    expect(html).toContain("relative mt-6 hidden overflow-x-auto rounded-lg border border-line bg-surface lg:block");
    expect(html).not.toContain("overflow-hidden");
  });

  it("cards still show stock and the row actions", () => {
    expect(html).toContain("Stock 0");
    expect(html).toContain(">Edit</button>");
  });
});

describe("Admin user list (US-21 AC3)", () => {
  const html = renderToStaticMarkup(createElement(UserList, { users: [user], meId: "a" }));

  it("cards below 1024 px, table from 1024 px", () => {
    expect(html).toContain('class="mt-6 grid gap-3 md:grid-cols-2 lg:hidden"');
    expect(html).toContain("relative mt-6 hidden overflow-x-auto rounded-lg border border-line bg-surface lg:block");
  });
});

describe("Admin layout (US-21 AC3)", () => {
  it("menu above the content below 1024 px, sidebar from 1024 px; the menu row scrolls by itself", async () => {
    const html = renderToStaticMarkup(await AdminLayout({ children: createElement("p", null, "content") }));
    expect(html).toContain("flex-col gap-6 px-4 py-6 lg:flex-row");
    expect(html).toContain('class="min-w-0 lg:w-52 lg:shrink-0"');
    expect(html).toContain("overflow-x-auto lg:flex-col");
    expect(html).toContain("min-h-11"); // 44 px menu links
    expect(html).toContain('<main class="min-w-0 flex-1">');
  });
});
