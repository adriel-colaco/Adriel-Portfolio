"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { subscribe, prefersReducedMotion, LERP } from "./parallaxTicker";

type ParallaxCardProps = {
  className?: string;
  style?: CSSProperties;
  /** Max vertical drift as a fraction of the card height (signed). */
  speed?: number;
  children: ReactNode;
};

/**
 * Wraps a card and drifts it vertically as it travels through the viewport,
 * eased so it keeps gliding briefly after the scroll stops. Different `speed`
 * values per card make them move at slightly different rates for depth.
 *
 * The base position is read from `offsetParent`/`offsetTop` (transform-agnostic)
 * so the element never measures its own applied transform — no feedback loop.
 */
export default function ParallaxCard({
  className,
  style,
  speed = 0.04,
  children,
}: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !speed || prefersReducedMotion()) return;

    // The baseline is the card's position at scroll 0, computed absolutely so it
    // is scroll-invariant: the drift is always 0 at the top of the page, no
    // matter which scroll position the page was (re)loaded at. Capturing it from
    // the first frame instead would bake in the reload scroll offset, leaving the
    // cards misplaced when you scroll back to the top.
    let current = 0;
    let started = false;
    const step = () => {
      const parent = el.offsetParent as HTMLElement | null;
      if (!parent) return; // hidden (e.g. below lg)
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const baseTop = parent.getBoundingClientRect().top + el.offsetTop;
      const h = el.offsetHeight;
      const half = vh / 2 + h / 2;
      const center = baseTop + h / 2;
      const target = Math.max(-1, Math.min(1, (center - vh / 2) / half));
      // `center + scrollY` is the card's absolute (scroll-invariant) center.
      const initial = Math.max(
        -1,
        Math.min(1, (center + window.scrollY - vh / 2) / half),
      );
      if (!started) {
        current = target;
        started = true;
      }
      if (baseTop + h < -vh || baseTop > vh * 2) {
        // Off-screen: stay synced with the scroll (no easing needed while hidden)
        // so the card doesn't pop when it scrolls back into view.
        current = target;
        return;
      }
      current += (target - current) * LERP;
      // Positive drift = downward: the card trails the scroll instead of leading it.
      el.style.transform = `translate3d(0, ${((initial - current) * h * speed).toFixed(2)}px, 0)`;
    };

    return subscribe(step);
  }, [speed]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
