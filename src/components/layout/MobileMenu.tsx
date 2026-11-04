"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import { categoryHref, type CategoryLink } from "@/lib/queries/categories";
import { SearchBox } from "./SearchBox";
import { navLink, primaryButton, secondaryButton } from "./styles";

export type HeaderUser = { name: string; email: string; isAdmin: boolean } | null;

/**
 * Phone menu (< 768 px, US-29 AC3): hamburger button + panel with search, Books, categories and account links.
 * Closes on the ✕ button, Escape, a link click and any navigation.
 */
export function MobileMenu({ categories, user }: { categories: CategoryLink[]; user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  // Close after navigation (e.g. the search form or the browser Back button).
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-surface text-foreground hover:bg-background focus-visible:outline-2 focus-visible:outline-brand"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div id={panelId} className="absolute inset-x-0 top-full z-30 border-b border-line bg-surface shadow-lg">
          <div className="mx-auto flex max-h-[calc(100vh-4rem)] max-w-6xl flex-col gap-3 overflow-y-auto px-4 py-4">
            <SearchBox id="mobile-search" />

            <nav aria-label="Mobile" className="flex flex-col">
              <Link href="/books" onClick={close} className={navLink}>
                Books
              </Link>
              {user?.isAdmin && (
                <Link href="/admin" onClick={close} className={navLink}>
                  Admin
                </Link>
              )}
            </nav>

            <div className="border-t border-line pt-3">
              <p className="px-3 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">Categories</p>
              {categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted">No categories yet.</p>
              ) : (
                <ul className="flex flex-col">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link href={categoryHref(category.id)} onClick={close} className={`${navLink} w-full`}>
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-line pt-3">
              {user ? (
                <div className="flex flex-col gap-2">
                  <p className="truncate px-3 text-sm text-muted" title={user.email}>
                    Hi, <span className="font-medium text-foreground">{user.name}</span>
                  </p>
                  <form action={logoutAction}>
                    <button type="submit" className={`${secondaryButton} w-full`}>
                      Logout
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" onClick={close} className={secondaryButton}>
                    Log in
                  </Link>
                  <Link href="/register" onClick={close} className={primaryButton}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
