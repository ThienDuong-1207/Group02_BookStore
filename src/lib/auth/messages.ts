import type { FieldErrors } from "@/lib/validation/auth";

/** What the login/register server actions return to the form when something is wrong. */
export type AuthFormState = {
  fieldErrors?: FieldErrors;
  formError?: string;
};

/** Exact wording from the US-10 acceptance criteria (PROJECT_SPEC.md §7). */
export const MESSAGES = {
  emailTaken: "This email is already registered",
  badCredentials: "Incorrect email or password",
  locked: "Your account has been locked. Please contact the administrator",
  unexpected: "Something went wrong. Please try again.",
} as const;
