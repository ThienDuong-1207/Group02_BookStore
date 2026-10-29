import { z } from "zod";
import { emailSchema, fullNameSchema, passwordSchema } from "@/lib/validation/auth";

/**
 * US-14: admin creates an account. Shared by the form (client) and the server action, so both sides
 * reject exactly the same data. B1: the same rules as registration (US-10 B1) – the schemas are reused.
 */
export const ROLES = ["CUSTOMER", "ADMIN"] as const;

export const createUserSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(ROLES, "Choose a role"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const CREATE_USER_FIELDS = ["fullName", "email", "password", "role"] as const;
