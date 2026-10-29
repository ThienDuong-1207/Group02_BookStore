import type { SupabaseClient } from "@supabase/supabase-js";
import type { AccountStatus, UserRole } from "@/lib/auth/profile";

/** One row of the admin user list (US-14 M1). */
export type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
};

/**
 * All accounts, newest first (US-14 M1).
 * Uses the normal server client: the RLS policy "profiles: admin read all" lets an ACTIVE admin read every row,
 * while anyone else would only get their own row (layer 3 of US-13).
 */
export async function listUsers(supabase: SupabaseClient): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status, created_at")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserRow[];
}

/** "29/10/2026" – dates are shown in Vietnam time, whatever the server's time zone is. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
}
