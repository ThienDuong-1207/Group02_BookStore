import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-14 (GB-39) M2, E1, B1 + US-13 E3: calls createUserAction directly, as someone bypassing the form would.
 * requireAdmin(), the Supabase admin client and Next.js cache are mocked, so no real database is needed.
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

const createUser = vi.fn();
const deleteUser = vi.fn();
const update = vi.fn();
const eq = vi.fn();
let updateError: unknown = null;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { createUser, deleteUser } },
    from: () => ({
      update: (values: unknown) => {
        update(values);
        return { eq: async (column: string, value: unknown) => (eq(column, value), { error: updateError }) };
      },
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { createUserAction } = await import("@/lib/admin/user-actions");
const { MESSAGES } = await import("@/lib/auth/messages");
const { ADMIN_MESSAGES } = await import("@/lib/admin/messages");

const valid = { fullName: "Nguyen Van B", email: "B@Example.com", password: "abc12345", role: "ADMIN" };
function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  caller = "admin";
  updateError = null;
  vi.clearAllMocks();
  createUser.mockResolvedValue({ data: { user: { id: "new-1" } }, error: null });
  deleteUser.mockResolvedValue({ error: null });
});

describe("US-13 E3 – only admins can create accounts", () => {
  it("rejects a guest without touching Supabase", async () => {
    caller = "guest";
    await expect(createUserAction({}, form(valid))).resolves.toEqual({ formError: ADMIN_MESSAGES.notLoggedIn });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("rejects a customer without touching Supabase", async () => {
    caller = "customer";
    await expect(createUserAction({}, form(valid))).resolves.toEqual({ formError: ADMIN_MESSAGES.forbidden });
    expect(createUser).not.toHaveBeenCalled();
  });
});

describe("US-14 M2 – create an account", () => {
  it("creates a confirmed Auth user, sets the role and status ACTIVE, and reports success", async () => {
    const result = await createUserAction({}, form(valid));

    expect(createUser).toHaveBeenCalledWith({
      email: "b@example.com",
      password: "abc12345",
      email_confirm: true,
      user_metadata: { full_name: "Nguyen Van B" },
    });
    expect(update).toHaveBeenCalledWith({ role: "ADMIN", status: "ACTIVE", full_name: "Nguyen Van B" });
    expect(eq).toHaveBeenCalledWith("id", "new-1");
    expect(result).toEqual({ success: ADMIN_MESSAGES.created("b@example.com") });
  });

  it("creates a CUSTOMER when that role is chosen", async () => {
    await createUserAction({}, form({ ...valid, role: "CUSTOMER" }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ role: "CUSTOMER" }));
  });

  it("removes the Auth user again if the role cannot be saved", async () => {
    updateError = new Error("db down");
    await expect(createUserAction({}, form(valid))).resolves.toEqual({ formError: MESSAGES.unexpected });
    expect(deleteUser).toHaveBeenCalledWith("new-1");
  });
});

describe("US-14 E1 – email already registered", () => {
  it.each(["email_exists", "user_already_exists"])("shows the registration message (%s)", async (code) => {
    createUser.mockResolvedValue({ data: { user: null }, error: { code, message: "exists" } });
    await expect(createUserAction({}, form(valid))).resolves.toEqual({ fieldErrors: { email: MESSAGES.emailTaken } });
    expect(update).not.toHaveBeenCalled();
  });
});

describe("US-14 B1 – same validation as US-10, checked on the server", () => {
  it.each([
    ["password of 7 characters", { password: "abc1234" }, "password"],
    ["password without a digit", { password: "abcdefgh" }, "password"],
    ["password of 65 characters", { password: "a1".repeat(32) + "x" }, "password"],
    ["invalid email", { email: "not-an-email" }, "email"],
    ["empty full name", { fullName: "   " }, "fullName"],
    ["unknown role", { role: "SUPERADMIN" }, "role"],
    ["missing role", { role: "" }, "role"],
  ])("rejects %s", async (_label, change, field) => {
    const result = await createUserAction({}, form({ ...valid, ...change }));
    expect(result.fieldErrors?.[field]).toBeTruthy();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("accepts a password of exactly 8 characters", async () => {
    const result = await createUserAction({}, form({ ...valid, password: "abcd1234" }));
    expect(result.success).toBeTruthy();
  });
});
