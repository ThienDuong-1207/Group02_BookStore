import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Calls the server actions directly, as an attacker who bypasses the browser form would (US-10 B2).
 * Supabase and Next.js navigation are mocked, so no real database is needed.
 */

const auth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
};
let profileStatus: string | null = "ACTIVE";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: profileStatus ? { status: profileStatus } : null }) }),
      }),
    }),
  }),
}));

class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`redirect:${url}`);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectSignal(url);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { registerAction, loginAction, logoutAction } = await import("@/lib/auth/actions");
const { MESSAGES } = await import("@/lib/auth/messages");

function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

const validRegistration = { fullName: "Nguyen Van A", email: "a@example.com", password: "abc12345", phone: "0912345678" };

beforeEach(() => {
  vi.clearAllMocks();
  profileStatus = "ACTIVE";
});

describe("registerAction", () => {
  it("M1: creates the account with name/phone metadata and redirects to /books", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [{}] }, session: {} }, error: null });

    await expect(registerAction({}, form(validRegistration))).rejects.toMatchObject({ url: "/books" });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "a@example.com",
      password: "abc12345",
      options: { data: { full_name: "Nguyen Van A", phone: "0912345678" } },
    });
  });

  it("B2: the server rejects invalid data even if the client check is bypassed", async () => {
    const state = await registerAction({}, form({ ...validRegistration, password: "abc1234", phone: "123" }));
    expect(state.fieldErrors?.password).toBeDefined();
    expect(state.fieldErrors?.phone).toBeDefined();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("E1: an already registered email shows the duplicate message", async () => {
    auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { code: "user_already_exists" } });
    const state = await registerAction({}, form(validRegistration));
    expect(state.fieldErrors?.email).toBe(MESSAGES.emailTaken);
  });

  it("E1: also detects duplicates when Supabase hides them (no identities)", async () => {
    auth.signUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null });
    const state = await registerAction({}, form(validRegistration));
    expect(state.fieldErrors?.email).toBe(MESSAGES.emailTaken);
  });
});

describe("loginAction", () => {
  const credentials = { email: "a@example.com", password: "abc12345" };

  it("M2: logs in and redirects to /books", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    await expect(loginAction({}, form(credentials))).rejects.toMatchObject({ url: "/books" });
  });

  it("M2: returns to a safe ?next= page but ignores external URLs", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    await expect(loginAction({}, form({ ...credentials, next: "/admin" }))).rejects.toMatchObject({ url: "/admin" });
    await expect(loginAction({}, form({ ...credentials, next: "//evil.com" }))).rejects.toMatchObject({
      url: "/books",
    });
  });

  it("E2: wrong email or password shows one generic message", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: "invalid_credentials" } });
    const state = await loginAction({}, form(credentials));
    expect(state.formError).toBe(MESSAGES.badCredentials);
  });

  it("E3: a banned (locked) account cannot log in", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: "user_banned" } });
    const state = await loginAction({}, form(credentials));
    expect(state.formError).toBe(MESSAGES.locked);
  });

  it("E3: profile status LOCKED signs the user out immediately", async () => {
    profileStatus = "LOCKED";
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const state = await loginAction({}, form(credentials));
    expect(state.formError).toBe(MESSAGES.locked);
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("B2: empty fields are rejected on the server", async () => {
    const state = await loginAction({}, form({ email: "", password: "" }));
    expect(state.fieldErrors?.email).toBeDefined();
    expect(state.fieldErrors?.password).toBeDefined();
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("logoutAction", () => {
  it("M3: ends the session and returns to /books", async () => {
    await expect(logoutAction()).rejects.toMatchObject({ url: "/books" });
    expect(auth.signOut).toHaveBeenCalled();
  });
});
