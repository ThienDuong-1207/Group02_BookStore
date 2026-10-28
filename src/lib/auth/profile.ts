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
