import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/profile";
import { logoutAction } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { listMenuCategories } from "@/lib/queries/categories";
import { CategoryMenu } from "./CategoryMenu";
import { MobileMenu, type HeaderUser } from "./MobileMenu";
import { SearchBox } from "./SearchBox";
import { navLink, primaryButton, secondaryButton } from "./styles";

/**
 * Shared site header (US-29, wireframe: docs/design/wireframe-home-desktop.svg).
 * AC1: logo, Books, Categories menu, search box, login/account on every page.
 * AC2 (and US-13 M2): the Admin link is shown only to an ACTIVE administrator.
 * AC3: below 768 px everything except the logo moves into the hamburger menu.
 * US-10 M2: a logged-in user sees their name and a Logout button.
 */
export async function Header() {
  const [profile, categories] = await Promise.all([
    getCurrentProfile(),
    // The header is on every page: if categories cannot be loaded, show an empty menu instead of an error page.
    createClient()
      .then((supabase) => listMenuCategories(supabase))
      .catch(() => []),
  ]);
  const active = profile?.status === "ACTIVE" ? profile : null;
  const user: HeaderUser = active
    ? { name: active.full_name, email: active.email, isAdmin: active.role === "ADMIN" }
    : null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <Logo />

        {/* Tablet and desktop */}
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <Link href="/books" className={navLink}>
            Books
          </Link>
          <CategoryMenu categories={categories} />
        </nav>

        <div className="hidden min-w-0 flex-1 md:block md:max-w-sm lg:max-w-md">
          <SearchBox id="header-search" />
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user?.isAdmin && (
            <Link href="/admin" className={navLink}>
              Admin
            </Link>
          )}
          {user ? (
            <>
              <span className="max-w-40 truncate px-1 text-sm text-muted" title={user.email}>
                Hi, <span className="font-medium text-foreground">{user.name}</span>
              </span>
              <form action={logoutAction}>
                <button type="submit" className={secondaryButton}>
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={navLink}>
                Log in
              </Link>
              <Link href="/register" className={primaryButton}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Phone */}
        <div className="ml-auto md:hidden">
          <MobileMenu categories={categories} user={user} />
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <Link
      href="/books"
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md font-serif text-xl font-bold text-brand focus-visible:outline-2 focus-visible:outline-brand"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
        <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
        <path d="M9 7h7" strokeLinecap="round" />
      </svg>
      Book Store
    </Link>
  );
}
