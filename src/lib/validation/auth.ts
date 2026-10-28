import { z } from "zod";

/**
 * Validation rules for US-10 (register / login), shared by the client forms and the server actions
 * so both sides reject exactly the same data (AC B1, B2). US-14 reuses `passwordSchema` / `phoneSchema`.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email is required")
  .pipe(z.email("Enter a valid email address"));

// B1: 8–64 characters, at least one letter and one digit.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must be at most 64 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

// B1: optional; if given, 10 digits starting with 0. An empty input means "not given".
export const phoneSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .trim()
    .regex(/^0[0-9]{9}$/, "Phone must be 10 digits starting with 0")
    .optional(),
);

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .max(100, "Full name must be at most 100 characters");

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

// Login only checks that both fields are filled in; wrong values get the generic E2 message.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export type FieldErrors = Partial<Record<string, string>>;

/** First error message per field, e.g. { password: "Password must be at least 8 characters" }. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    result[field] ??= issue.message;
  }
  return result;
}

/** Reads the named text fields of a submitted form into a plain object for Zod. */
export function formDataToObject(formData: FormData, fields: readonly string[]) {
  return Object.fromEntries(fields.map((name) => [name, formData.get(name)?.toString() ?? ""]));
}

export const REGISTER_FIELDS = ["fullName", "email", "password", "phone"] as const;
export const LOGIN_FIELDS = ["email", "password"] as const;
