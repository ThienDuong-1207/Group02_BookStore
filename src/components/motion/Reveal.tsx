"use client";

import { createElement, useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  /** HTML tag to render (a grid needs `li`). */
  as?: "div" | "li" | "section";
  /** Milliseconds to wait before moving in – used to stagger the cards of one row. */
  delay?: number;
  className?: string;
  children: ReactNode;
};

/**
 * Scroll reveal: the element slides up and fades in the first time it scrolls into view.
 *
 * How it works: the server always renders the element fully visible. After the page loads, an element that is
 * still BELOW the screen gets `data-wait` (hidden by `.reveal[data-wait]` in globals.css); an IntersectionObserver
 * removes it when the element enters the screen and the CSS transition plays. So nothing is hidden without
 * JavaScript, nothing already on screen flickers, and `prefers-reduced-motion` skips the effect completely.
 */
export function Reveal({ as = "div", delay = 0, className = "", children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return; // already on screen

    element.setAttribute("data-wait", "");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          element.removeAttribute("data-wait");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.removeAttribute("data-wait");
    };
  }, []);

  return createElement(
    as,
    { ref, className: `reveal ${className}`.trim(), style: delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined },
    children,
  );
}
