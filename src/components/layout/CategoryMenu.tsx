"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { categoryHref, type CategoryLink } from "@/lib/queries/categories";
import { navLink } from "./styles";

/** Desktop "Categories" drop-down (US-29 AC1). Closes on Escape, on a click outside and after choosing a category. */
export function CategoryMenu({ categories }: { categories: CategoryLink[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={`${navLink} gap-1`}
      >
        Categories
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <ul
          id={menuId}
          className="absolute left-0 z-20 mt-1 max-h-80 w-64 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lg"
        >
          {categories.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No categories yet.</li>
          ) : (
            categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={categoryHref(category.id)}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-brand-surface hover:text-brand focus-visible:outline-2 focus-visible:outline-brand"
                >
                  {category.name}
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
