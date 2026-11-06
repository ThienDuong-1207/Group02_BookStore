import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-29 (GB-106) AC1, AC2, AC3: renders the server Header to HTML with the session and Supabase mocked.
 * Client parts (CategoryMenu, MobileMenu) render in their closed state, as on first load.
 */

type Profile = { id: string; email: string; full_name: string; role: "ADMIN" | "CUSTOMER"; status: "ACTIVE" | "LOCKED" };
let profile: Profile | null = null;
vi.mock("@/lib/auth/profile", () => ({ getCurrentProfile: async () => profile }));
vi.mock("@/lib/auth/actions", () => ({ logoutAction: async () => {} }));
vi.mock("next/navigation", () => ({ usePathname: () => "/books" }));

let categories: { id: string; name: string }[] = [];
let queryError: unknown = null;
let clientFails = false;
const eq = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    if (clientFails) throw new Error("env missing");
    return {
      from: () => ({
        select: () => ({
          eq: (column: string, value: unknown) => {
            eq(column, value);
            return { order: async () => ({ data: queryError ? null : categories, error: queryError }) };
          },
        }),
      }),
    };
  },
}));

const { Header } = await import("@/components/layout/Header");
const render = async () => renderToStaticMarkup(await Header());

const admin: Profile = { id: "a", email: "admin@bookstore.demo", full_name: "Demo Admin", role: "ADMIN", status: "ACTIVE" };
const customer: Profile = { id: "c", email: "customer@bookstore.demo", full_name: "Demo Customer", role: "CUSTOMER", status: "ACTIVE" };

beforeEach(() => {
  profile = null;
  categories = [{ id: "cat-1", name: "Fiction" }];
  queryError = null;
  clientFails = false;
  eq.mockClear();
});

describe("Header (US-29)", () => {
  it("AC1: shows logo, Books, Categories, search box and Log in / Register for a guest", async () => {
    const html = await render();
    expect(html).toContain("Book Store");
    expect(html).toContain('href="/books"');
    expect(html).toContain("Categories");
    expect(html).toContain('role="search"');
    expect(html).toContain('action="/books"');
    expect(html).toContain('name="q"');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/register"');
    expect(html).not.toContain("Logout");
    expect(html).not.toContain('href="/admin"');
  });

  it("AC2: a customer sees their name and Logout but no Admin link", async () => {
    profile = customer;
    const html = await render();
    expect(html).toContain("Demo Customer");
    expect(html).toContain("Logout");
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain('href="/admin"');
  });

  it("AC2: an active admin sees the Admin link", async () => {
    profile = admin;
    const html = await render();
    expect(html).toContain('href="/admin"');
    expect(html).toContain("Demo Admin");
  });

  it("AC2: a locked admin is treated as a guest (no Admin link, no name)", async () => {
    profile = { ...admin, status: "LOCKED" };
    const html = await render();
    expect(html).not.toContain('href="/admin"');
    expect(html).not.toContain("Demo Admin");
    expect(html).toContain('href="/login"');
  });

  it("AC3: renders a hamburger button (closed) for phones and hides the desktop block below md", async () => {
    const html = await render();
    expect(html).toContain("Open menu");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden items-center gap-1 md:flex");
  });

  it("only loads visible categories", async () => {
    await render();
    expect(eq).toHaveBeenCalledWith("is_hidden", false);
  });

  it("still renders when the categories query fails", async () => {
    queryError = { message: "boom" };
    await expect(render()).resolves.toContain("Book Store");
  });

  it("still renders when the Supabase client cannot be created", async () => {
    clientFails = true;
    await expect(render()).resolves.toContain("Book Store");
  });
});
