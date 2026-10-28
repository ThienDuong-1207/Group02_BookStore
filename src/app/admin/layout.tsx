import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthorizationError, requireAdmin } from "@/lib/auth/profile";
import { ADMIN_SECTIONS } from "./sections";

/**
 * Layer 2 of US-13: every /admin page re-checks the role on the server, even if the middleware was skipped.
 * Layer 3 is RLS in the database (supabase/migrations/*_rls.sql).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect(error.status === 401 ? "/login?next=/admin" : "/forbidden");
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
      <nav aria-label="Admin" className="md:w-52 md:shrink-0">
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          <li>
            <Link href="/admin" className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-surface">
              Dashboard
            </Link>
          </li>
          {ADMIN_SECTIONS.map((section) => (
            <li key={section.href}>
              {section.ready ? (
                <Link
                  href={section.href}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-surface"
                >
                  {section.title}
                </Link>
              ) : (
                <span className="flex min-h-11 items-center px-3 text-sm whitespace-nowrap text-muted">
                  {section.title}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
