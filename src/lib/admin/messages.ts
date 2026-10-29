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
} as const;
