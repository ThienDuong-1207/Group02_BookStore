"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { MESSAGES, type AuthFormState } from "@/lib/auth/messages";
import {
  LOGIN_FIELDS,
  REGISTER_FIELDS,
  formDataToObject,
  loginSchema,
  registerSchema,
  toFieldErrors,
} from "@/lib/validation/auth";

// A "use server" file may only export async functions, so messages and types live in ./messages.

/** US-10 M1, E1, B1, B2: create a CUSTOMER account and log the user in. */
export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  // B2: never trust the client, validate again with the same schema.
  const parsed = registerSchema.safeParse(formDataToObject(formData, REGISTER_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };
  const { fullName, email, password, phone } = parsed.data;

  const supabase = await createClient();
  // Supabase Auth hashes the password (bcrypt) in auth.users (B3). The handle_new_user trigger
  // creates public.profiles with role CUSTOMER and status ACTIVE from this metadata.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone: phone ?? "" } },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { fieldErrors: { email: MESSAGES.emailTaken } };
    }
    if (error.code === "weak_password") return { fieldErrors: { password: error.message } };
    return { formError: MESSAGES.unexpected };
  }
  // With "Confirm email" turned on, Supabase hides duplicates by returning a user with no identities.
  if (data.user && data.user.identities?.length === 0) {
    return { fieldErrors: { email: MESSAGES.emailTaken } };
  }
  if (!data.session) {
    // Only happens if "Confirm email" is on in the Supabase dashboard (it must be off for M1).
    return { formError: "Account created. Please confirm your email, then log in." };
  }

  revalidatePath("/", "layout");
  redirect("/books");
}

/** US-10 M2, E2, E3: log in with email + password. */
export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(formDataToObject(formData, LOGIN_FIELDS));
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Locked accounts are also banned in Supabase Auth (US-14), which returns "user_banned".
    if (error.code === "user_banned") return { formError: MESSAGES.locked };
    // E2: the same message for a wrong email and a wrong password.
    return { formError: MESSAGES.badCredentials };
  }

  // E3: double-check our own status column in case the Auth ban was not applied.
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", data.user.id)
    .maybeSingle<{ status: string }>();
  if (profile?.status === "LOCKED") {
    await supabase.auth.signOut();
    return { formError: MESSAGES.locked };
  }

  revalidatePath("/", "layout");
  redirect(safeNextPath(formData.get("next")?.toString()));
}

/** US-10 M3: end the session and go back to the book list as a guest. */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/books");
}
