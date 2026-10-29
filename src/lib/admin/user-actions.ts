"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireAdmin } from "@/lib/auth/profile";
import { MESSAGES } from "@/lib/auth/messages";
import { ADMIN_MESSAGES, type AdminFormState } from "@/lib/admin/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { formDataToObject, toFieldErrors } from "@/lib/validation/auth";
import { CREATE_USER_FIELDS, createUserSchema } from "@/lib/validation/users";

/** US-13 E3: every admin action starts here. Guests and non-admins get an error and nothing changes. */
async function checkAdmin(): Promise<AdminFormState | null> {
  try {
    await requireAdmin();
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { formError: error.status === 401 ? ADMIN_MESSAGES.notLoggedIn : ADMIN_MESSAGES.forbidden };
    }
    throw error;
  }
}

/** US-14 M2, E1, B1: create an ACTIVE account with the chosen role. */
export async function createUserAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const denied = await checkAdmin();
  if (denied) return denied;

  // B1: never trust the client, validate again with the same schema as the form.
  const parsed = createUserSchema.safeParse(formDataToObject(formData, CREATE_USER_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { fullName, email, password, role } = parsed.data;

  // Creating users needs the service-role key, so this client exists only on the server (src/lib/supabase/admin.ts).
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password, // hashed by Supabase Auth (bcrypt), never stored in our tables (NFR-5)
    email_confirm: true, // can log in immediately
    user_metadata: { full_name: fullName },
  });

  if (error) {
    // E1: same message as registration.
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return { fieldErrors: { email: MESSAGES.emailTaken } };
    }
    if (error.code === "weak_password") return { fieldErrors: { password: error.message } };
    return { formError: MESSAGES.unexpected };
  }

  // The handle_new_user trigger created the profile as CUSTOMER / ACTIVE; now apply the chosen role.
  const { error: roleError } = await admin
    .from("profiles")
    .update({ role, status: "ACTIVE", full_name: fullName })
    .eq("id", data.user.id);
  if (roleError) {
    // Do not leave a half-created account behind (e.g. an "admin" that is only a customer).
    await admin.auth.admin.deleteUser(data.user.id);
    return { formError: MESSAGES.unexpected };
  }

  revalidatePath("/admin/users"); // M2: the new account shows up in the list straight away
  return { success: ADMIN_MESSAGES.created(email) };
}
