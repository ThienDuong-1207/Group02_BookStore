import { beforeEach, describe, expect, it, vi } from "vitest";

/** US-13 E3, B1: requireAdmin() decides on the server from the database profile, not from the client. */

let userId: string | null = null;
let profile: { role: string; status: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: userId ? { claims: { sub: userId } } : null }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: profile ? { id: userId, email: "x@example.com", full_name: "X", ...profile } : null,
          }),
        }),
      }),
    }),
  }),
}));

const { requireAdmin, AuthorizationError } = await import("@/lib/auth/profile");

beforeEach(() => {
  userId = "u1";
  profile = null;
});

describe("requireAdmin", () => {
  it("allows an ACTIVE admin", async () => {
    profile = { role: "ADMIN", status: "ACTIVE" };
    await expect(requireAdmin()).resolves.toMatchObject({ role: "ADMIN" });
  });

  it("E3: rejects a guest with 401", async () => {
    userId = null;
    await expect(requireAdmin()).rejects.toMatchObject({ status: 401 });
  });

  it("E3: rejects a CUSTOMER with 403", async () => {
    profile = { role: "CUSTOMER", status: "ACTIVE" };
    const error = await requireAdmin().catch((e) => e);
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error.status).toBe(403);
  });

  it("B1: rejects an admin who was locked while logged in", async () => {
    profile = { role: "ADMIN", status: "LOCKED" };
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
});
