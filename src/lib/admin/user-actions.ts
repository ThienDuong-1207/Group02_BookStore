"use server";

import { revalidatePath } from "next/cache";
import { AuthorizationError, requireAdmin } from "@/lib/auth/profile";
import { MESSAGES } from "@/lib/auth/messages";
import { ADMIN_MESSAGES, LOCK_BAN_DURATION, type AdminFormState } from "@/lib/admin/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { formDataToObject, toFieldErrors } from "@/lib/validation/auth";
import {
  CREATE_USER_FIELDS,
  SET_USER_STATUS_FIELDS,
  createUserSchema,
  setUserStatusSchema,
} from "@/lib/validation/users";

/**
 * US-13 E3: every admin action starts here. Guests and non-admins get an error and nothing changes.
 * Returns the logged-in admin's id, or the error to show.
 */
async function checkAdmin(): Promise<{ adminId: string; denied?: never } | { denied: AdminFormState }> {
  try {
    const admin = await requireAdmin();
    return { adminId: admin.id };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { denied: { formError: error.status === 401 ? ADMIN_MESSAGES.notLoggedIn : ADMIN_MESSAGES.forbidden } };
    }
    throw error;
  }
}

/** US-14 M2, E1, B1: create an ACTIVE account with the chosen role. */
export async function createUserAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;

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

/**
 * US-14 M3, E2: lock (status LOCKED + Auth ban) or unlock (status ACTIVE + ban removed) an account.
 * Both are needed: the Auth ban stops new logins and token refreshes, the profile status is what
 * requireAdmin(), the login check (US-10 E3) and the user list read.
 */
export async function setUserStatusAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const check = await checkAdmin();
  if (check.denied) return check.denied;

  const parsed = setUserStatusSchema.safeParse(formDataToObject(formData, SET_USER_STATUS_FIELDS));
  if (!parsed.success) return { formError: parsed.error.issues[0].message };
  const { userId, status } = parsed.data;

  // E2: the button is disabled for the admin's own row; the server rejects it too, in case the form is bypassed.
  if (status === "LOCKED" && userId === check.adminId) return { formError: ADMIN_MESSAGES.selfLock };

  const admin = createAdminClient();
  const { data: target, error: findError } = await admin
    .from("profiles")
    .select("id, email, status")
    .eq("id", userId)
    .maybeSingle<{ id: string; email: string; status: string }>();
  if (findError) return { formError: MESSAGES.unexpected };
  if (!target) return { formError: ADMIN_MESSAGES.notFound };

  const banDuration = status === "LOCKED" ? LOCK_BAN_DURATION : "none";
  const { error: banError } = await admin.auth.admin.updateUserById(userId, { ban_duration: banDuration });
  if (banError) return { formError: MESSAGES.unexpected };

  const { error: statusError } = await admin.from("profiles").update({ status }).eq("id", userId);
  if (statusError) {
    // Keep Auth and the profile in sync: put the ban back as it was if the status could not be saved.
    await admin.auth.admin.updateUserById(userId, {
      ban_duration: target.status === "LOCKED" ? LOCK_BAN_DURATION : "none",
    });
    return { formError: MESSAGES.unexpected };
  }

  revalidatePath("/admin/users");
  return { success: status === "LOCKED" ? ADMIN_MESSAGES.locked(target.email) : ADMIN_MESSAGES.unlocked(target.email) };
}
