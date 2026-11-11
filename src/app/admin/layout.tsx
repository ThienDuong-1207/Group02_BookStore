import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthorizationError, requireAdmin } from "@/lib/auth/profile";
import { ADMIN_SECTIONS } from "./sections";

/**
 * Layer 2 of US-13: every /admin page re-checks the role on the server, even if the middleware was skipped.
 * Layer 3 is RLS in the database (supabase/migrations/*_rls.sql).
 * US-21 AC3: the admin menu is a row above the content below 1024 px (a sidebar would leave tablets ~500 px for
 * tables and forms) and a sidebar from 1024 px; the menu row scrolls by itself, never the page.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect(error.status === 401 ? "/login?next=/admin" : "/forbidden");
    throw error;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
      <nav aria-label="Admin" className="min-w-0 lg:w-52 lg:shrink-0">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          <li>
            <Link href="/admin" className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand">
              Dashboard
            </Link>
          </li>
          {ADMIN_SECTIONS.map((section) => (
            <li key={section.href}>
              {section.ready ? (
                <Link
                  href={section.href}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap hover:bg-surface focus-visible:outline-2 focus-visible:outline-brand"
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
