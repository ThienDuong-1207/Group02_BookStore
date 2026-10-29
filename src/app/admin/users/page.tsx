import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/queries/users";
import { UserList } from "@/components/admin/UserList";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export const metadata: Metadata = { title: "Users – Admin – Book Store" };

/**
 * US-14 M1: list of all accounts with name, email, role, status and created date. M2: form to create an account.
 * Access: the admin layout already runs requireAdmin() (US-13 layer 2) and RLS only returns every row to admins (layer 3).
 */
export default async function AdminUsersPage() {
  const me = await getCurrentProfile();
  const supabase = await createClient();
  const users = await listUsers(supabase);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted">
          {users.length} {users.length === 1 ? "account" : "accounts"}
        </p>
      </div>

      <section aria-labelledby="create-user-heading" className="mt-6 rounded-lg border border-line bg-surface p-5">
        <h2 id="create-user-heading" className="mb-4 text-lg font-semibold">
          Create account
        </h2>
        <CreateUserForm />
      </section>

      <UserList users={users} meId={me?.id} />
    </>
  );
}
