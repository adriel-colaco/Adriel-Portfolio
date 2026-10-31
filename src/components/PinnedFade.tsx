"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { prefersReducedMotion, subscribe } from "./parallaxTicker";

/**
 * A block that stays put on screen as the page scrolls, blurring more and more
 * and finally fading out as the content after it slides up over it.
 *
 * The pinning is CSS (`position: sticky` inside a track as tall as the
 * canvas), so the browser holds it on the compositor, in step with the
 * scroll — moving it from script each frame lagged a frame behind and made it
 * judder. It isn't held quite still: a scroll-driven CSS animation
 * (`.pinned-drift`) lets it rise at a tenth of the scroll's pace, so the
 * cards overtake it like a nearer layer (parallax depth). Only the blur and fade come from script, which can trail a frame
 * unseen. `span` is how far, in viewport heights, the page scrolls before it's
 * fully gone; gone, it stops taking clicks. Under reduced motion it only
 * fades (no blur, no scale).
 */
export default function PinnedFade({
  pinned = true,
  trackStyle,
  className,
  style,
  span = 0.85,
  children,
}: {
  /** Off: the block sits in the track's place and scrolls with the page, a
   *  little slower than it (`.hero-lag`), for a touch of depth. */
  pinned?: boolean;
  /** The track: positioned in the canvas, as tall as the block may stay pinned. */
  trackStyle: CSSProperties;
  className?: string;
  /** The block itself (sticky within the track). */
  style?: CSSProperties;
  span?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !pinned) return;
    // Reduced motion: no blur or scale, just a cross-fade as the cards come up.
    const reduce = prefersReducedMotion();
    let last = -1;
    const step = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const p = Math.min(1, Math.max(0, window.scrollY) / (span * vh));
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      if (p >= 1) {
        el.style.visibility = "hidden";
        return;
      }
      const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep
      el.style.visibility = "";
      // Clear for the first stretch of scroll (DELAY of the span), then the
      // blur builds up (and the block shrinks back, ever so slightly) and the
      // fade follows it out, so it lingers under the cards a while before it's
      // gone.
      const DELAY = 0.15;
      const q = Math.max(0, (p - DELAY) / (1 - DELAY));
      const blur = 16 * q;
      const fade = Math.min(1, Math.max(0, (q - 0.25) / 0.75));
      if (!reduce) {
        el.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "";
        // It sinks back a touch as it blurs (down to 97%), as if the cards
        // were passing in front of it — on the blur's own linear ramp, so the
        // two start and build together.
        el.style.scale = q > 0 ? (1 - 0.03 * q).toFixed(4) : "";
      }
      el.style.opacity = String(1 - ease(fade));
      el.style.pointerEvents = q > 0.1 ? "none" : "";
    };
    step();
    return subscribe(step);
  }, [span, pinned]);

  if (!pinned) {
    // The block's own height (`style`) replaces the track's reach to the bottom.
    return (
      <div className={`hero-lag absolute ${className ?? ""}`} style={{ ...trackStyle, bottom: "auto", ...style }}>
        {children}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute" style={trackStyle}>
      <div
        ref={ref}
        className={`pinned-drift pointer-events-auto sticky ${className ?? ""}`}
        style={{ willChange: "filter, opacity, scale, translate", "--drift-range": `${span * 100}vh`, ...style } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
