import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import { logoutAction } from "@/lib/auth/actions";

const linkClass =
  "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-background focus-visible:outline-2 focus-visible:outline-brand";

/** Site header. Shows the user's name + Logout when logged in (US-10 M2), the Admin link only for admins (US-13 M2). */
export async function Header() {
  const profile = await getCurrentProfile();
  const user = profile?.status === "ACTIVE" ? profile : null;

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link href="/books" className="inline-flex min-h-11 items-center text-lg font-bold text-brand">
          Book Store
        </Link>

        <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
          <Link href="/books" className={linkClass}>
            Books
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className={linkClass}>
              Admin
            </Link>
          )}

          {user ? (
            <>
              <span className="max-w-40 truncate px-2 text-sm text-muted" title={user.email}>
                Hi, <span className="font-medium text-foreground">{user.full_name}</span>
              </span>
              <form action={logoutAction}>
                <button type="submit" className={`${linkClass} border border-line`}>
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-11 items-center rounded-md bg-brand px-3 text-sm font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
