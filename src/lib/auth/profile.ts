import { createClient } from "@/lib/supabase/server";

export type UserRole = "ADMIN" | "CUSTOMER";
export type AccountStatus = "ACTIVE" | "LOCKED";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
};

/**
 * The logged-in user's profile, read ON THE SERVER, or null for a guest.
 * `getClaims()` verifies the session JWT, so the user id cannot be forged by the browser.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", userId)
    .maybeSingle<Profile>();
  return profile ?? null;
}

/** Thrown by `requireAdmin()`. status 401 = not logged in, 403 = logged in but not an active admin. */
export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "You must log in first." : "You do not have permission to access this page.");
    this.name = "AuthorizationError";
  }
}

/**
 * First line of every admin page, Server Action and Route Handler (US-13 E3, B1).
 * The role AND the status are re-read on every call, so an admin locked while logged in is rejected
 * on their next request, not only at login.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new AuthorizationError(401);
  if (profile.role !== "ADMIN" || profile.status !== "ACTIVE") throw new AuthorizationError(403);
  return profile;
}
