"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./parallaxTicker";

/**
 * Holds an element's `.rise` / `.draw` children on their first frame (armed)
 * until it scrolls `rootMargin` into view, then lets them play once. Without
 * JS nothing is armed, so the entrance just plays at load.
 */
export function useRevealOnView(ref: RefObject<HTMLElement | null>, rootMargin = "0px 0px -20% 0px") {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.dataset.reveal = "armed";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.reveal = "shown";
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}


/**
 * Holds its `.rise` / `.draw` descendants on their first frame until it
 * scrolls `rootMargin` into view, then lets them play (useRevealOnView).
 *
 * The wrapper itself never moves: the observer measures it with transforms
 * applied, so it must not be the one rising — an armed `.rise` sits a whole
 * height lower on its first frame and would trigger that much late. Put the
 * `.rise` on a child instead. Server-rendered content can go inside as-is.
 */
export default function Reveal({
  className,
  style,
  rootMargin = "0px 0px -15% 0px",
  children,
}: {
  className?: string;
  style?: CSSProperties;
  rootMargin?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRevealOnView(ref, rootMargin);
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
