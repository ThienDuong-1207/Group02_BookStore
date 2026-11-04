import type { FieldErrors } from "@/lib/validation/auth";

/** What the admin user actions return to the form (a "use server" file may only export async functions). */
export type AdminFormState = {
  fieldErrors?: FieldErrors;
  formError?: string;
  success?: string;
};

export const ADMIN_MESSAGES = {
  forbidden: "You do not have permission to access this page.",
  notLoggedIn: "You must log in first.",
  created: (email: string) => `Account created for ${email}.`,
  locked: (email: string) => `${email} is now locked and can no longer log in.`,
  unlocked: (email: string) => `${email} is unlocked and can log in again.`,
  selfLock: "You cannot lock your own account.",
  notFound: "Account not found.",
} as const;

/** Supabase Auth ban used for LOCKED accounts (US-14): 100 years, i.e. until an admin unlocks it. */
export const LOCK_BAN_DURATION = "876000h";
