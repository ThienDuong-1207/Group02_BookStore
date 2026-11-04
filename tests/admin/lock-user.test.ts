import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * US-14 (GB-39) M3, E2 + US-13 E3: calls setUserStatusAction directly, as someone bypassing the buttons would.
 * requireAdmin(), the Supabase admin client and Next.js cache are mocked, so no real database is needed.
 */

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

let caller: "admin" | "customer" | "guest" = "admin";
vi.mock("@/lib/auth/profile", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/profile")>("@/lib/auth/profile");
  return {
    ...actual,
    requireAdmin: async () => {
      if (caller === "guest") throw new actual.AuthorizationError(401);
      if (caller === "customer") throw new actual.AuthorizationError(403);
      return { id: ADMIN_ID, email: "admin@bookstore.demo", full_name: "Demo Admin", role: "ADMIN", status: "ACTIVE" };
    },
  };
});

let target: { id: string; email: string; status: string } | null = null;
let statusError: unknown = null;
const updateUserById = vi.fn();
const updateProfile = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { updateUserById } },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: target, error: null }) }) }),
      update: (values: unknown) => ({
        eq: async (_column: string, id: string) => (updateProfile(id, values), { error: statusError }),
      }),
    }),
  }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { setUserStatusAction } = await import("@/lib/admin/user-actions");
const { MESSAGES } = await import("@/lib/auth/messages");
const { ADMIN_MESSAGES, LOCK_BAN_DURATION } = await import("@/lib/admin/messages");

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
const lock = (userId = USER_ID) => setUserStatusAction({}, form({ userId, status: "LOCKED" }));
const unlock = (userId = USER_ID) => setUserStatusAction({}, form({ userId, status: "ACTIVE" }));

beforeEach(() => {
  caller = "admin";
  target = { id: USER_ID, email: "customer@bookstore.demo", status: "ACTIVE" };
  statusError = null;
  vi.clearAllMocks();
  updateUserById.mockResolvedValue({ error: null });
});

describe("US-13 E3 – only admins can lock or unlock", () => {
  it.each([
    ["guest", ADMIN_MESSAGES.notLoggedIn],
    ["customer", ADMIN_MESSAGES.forbidden],
  ] as const)("rejects a %s without touching Supabase", async (who, message) => {
    caller = who;
    await expect(lock()).resolves.toEqual({ formError: message });
    expect(updateUserById).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });
});

describe("US-14 M3 – lock and unlock", () => {
  it("lock: bans the Auth user and sets the profile to LOCKED", async () => {
    await expect(lock()).resolves.toEqual({ success: ADMIN_MESSAGES.locked("customer@bookstore.demo") });
    expect(updateUserById).toHaveBeenCalledWith(USER_ID, { ban_duration: LOCK_BAN_DURATION });
    expect(updateProfile).toHaveBeenCalledWith(USER_ID, { status: "LOCKED" });
  });

  it("unlock: removes the ban and sets the profile back to ACTIVE", async () => {
    target = { id: USER_ID, email: "customer@bookstore.demo", status: "LOCKED" };
    await expect(unlock()).resolves.toEqual({ success: ADMIN_MESSAGES.unlocked("customer@bookstore.demo") });
    expect(updateUserById).toHaveBeenCalledWith(USER_ID, { ban_duration: "none" });
    expect(updateProfile).toHaveBeenCalledWith(USER_ID, { status: "ACTIVE" });
  });

  it("does not change the profile when the Auth ban fails", async () => {
    updateUserById.mockResolvedValue({ error: { message: "auth down" } });
    await expect(lock()).resolves.toEqual({ formError: MESSAGES.unexpected });
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("puts the ban back as it was when the status cannot be saved", async () => {
    statusError = new Error("db down");
    await expect(lock()).resolves.toEqual({ formError: MESSAGES.unexpected });
    expect(updateUserById).toHaveBeenNthCalledWith(1, USER_ID, { ban_duration: LOCK_BAN_DURATION });
    expect(updateUserById).toHaveBeenNthCalledWith(2, USER_ID, { ban_duration: "none" });
  });

  it("reports an account that does not exist", async () => {
    target = null;
    await expect(lock()).resolves.toEqual({ formError: ADMIN_MESSAGES.notFound });
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it.each([
    ["a malformed id", { userId: "not-a-uuid", status: "LOCKED" }],
    ["an unknown status", { userId: USER_ID, status: "DELETED" }],
  ])("rejects %s", async (_label, values) => {
    const result = await setUserStatusAction({}, form(values));
    expect(result.formError).toBeTruthy();
    expect(updateUserById).not.toHaveBeenCalled();
  });
});

describe("US-14 E2 – an admin cannot lock their own account", () => {
  it("rejects a self-lock on the server", async () => {
    target = { id: ADMIN_ID, email: "admin@bookstore.demo", status: "ACTIVE" };
    await expect(lock(ADMIN_ID)).resolves.toEqual({ formError: ADMIN_MESSAGES.selfLock });
    expect(updateUserById).not.toHaveBeenCalled();
    expect(updateProfile).not.toHaveBeenCalled();
  });
});
