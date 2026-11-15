"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { COVER_TRANSITION_NAME } from "./names";

/**
 * List → detail animation: the cover of the clicked book card flies to its place on the detail page.
 * Mounted once in the root layout; it renders nothing.
 *
 * It listens for clicks on links marked `data-cover-transition` (the book cards). When the browser supports the
 * View Transitions API, it names the clicked cover, starts a transition and navigates inside it; the browser then
 * animates between the old and the new position of the element with that name. The transition waits until the
 * URL has changed (the new page is on screen) or, at most, 1.5 s.
 *
 * Everything else is left alone: other links, Ctrl/Cmd-click (new tab), browsers without the API and visitors who
 * asked for reduced motion all get the normal Next.js navigation.
 */
export function CoverTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const finish = useRef<(() => void) | null>(null);
  const named = useRef<HTMLElement | null>(null);

  // The URL changed → the new page is rendered → let the browser play the animation.
  useEffect(() => {
    finish.current?.();
    finish.current = null;
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[data-cover-transition]");
      const cover = link?.querySelector<HTMLElement>("[data-cover]");
      if (!link || !cover || typeof document.startViewTransition !== "function") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      event.preventDefault();
      // Only one element may carry the name at a time.
      if (named.current) named.current.style.viewTransitionName = "";
      named.current = cover;
      cover.style.viewTransitionName = COVER_TRANSITION_NAME;

      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            finish.current = resolve;
            window.setTimeout(resolve, 1500);
            router.push(link.pathname + link.search);
          }),
      );
    }
    // Capture phase: runs before the click handler of next/link, which then sees `defaultPrevented`.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
