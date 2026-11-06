import "server-only";
import { AuthorizationError, requireAdmin, type Profile } from "@/lib/auth/profile";

export const ACCESS_MESSAGES = {
  forbidden: "You do not have permission to access this page.",
  notLoggedIn: "You must log in first.",
} as const;

/**
 * US-13 E3 for the catalogue actions (books, promotions): run `requireAdmin()` and turn a 401/403 into the
 * message the form shows, instead of throwing. Guests and customers get the message and nothing changes.
 */
export async function checkAdmin(): Promise<{ admin: Profile; denied?: never } | { denied: { formError: string } }> {
  try {
    return { admin: await requireAdmin() };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { denied: { formError: error.status === 401 ? ACCESS_MESSAGES.notLoggedIn : ACCESS_MESSAGES.forbidden } };
    }
    throw error;
  }
}
