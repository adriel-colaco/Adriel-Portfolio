"use client";

import type { CSSProperties } from "react";
import { Fragment, useEffect, useRef } from "react";
import { subscribe, prefersReducedMotion } from "./parallaxTicker";

// Scroll window (as fractions of the viewport height) over which the letters fill.
// Exported so the line can chain off it and start exactly when the text is done.
export const QUOTE_START = 0.95; // fill begins when the text top sits this high (earlier in the scroll; the line chains off this so it starts sooner too)
export const QUOTE_SPAN = 0.75; // …and completes this much scrolling later

// Letter colour interpolates from the grey used across the grid to the ink blue.
const EMPTY = [212, 212, 216]; // #d4d4d8
const FILL = [0, 31, 255]; // --ink
// Each letter eases grey→blue over this many letters' worth of scroll, so the
// fill's leading edge is a short soft sweep rather than a hard letter-by-letter cut.
const SOFTNESS = 3;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (t: number) =>
  `rgb(${Math.round(lerp(EMPTY[0], FILL[0], t))}, ${Math.round(
    lerp(EMPTY[1], FILL[1], t),
  )}, ${Math.round(lerp(EMPTY[2], FILL[2], t))})`;

/**
 * The quote. It's simply there, grey (no entrance of its own); as it scrolls
 * up the blue sweeps through it left to right, one letter after another,
 * scrubbed by scroll position. The fill is spread over most of a viewport of
 * scrolling so its pace reads as tied to the scroll rather than snapping. Every
 * "i" is set in italic (the site's flourish). Under reduced motion the text is
 * simply blue.
 *
 * A "\n" in `text` forces a line break there (each line then never wraps), for
 * when the line breaks must match the design exactly rather than depend on the
 * browser's text metrics.
 */
export default function ScrollQuote({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const lines = text.split("\n");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const letters = Array.from(el.querySelectorAll<HTMLElement>("[data-letter]"));

    if (prefersReducedMotion()) {
      letters.forEach((s) => (s.style.color = mix(1)));
      return;
    }

    let cur = 0;
    const unsubscribe = subscribe(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // A wide window keeps the letter pace proportional to the scroll.
      const target = Math.max(
        0,
        Math.min(1, (QUOTE_START * vh - r.top) / (QUOTE_SPAN * vh)),
      );
      cur += (target - cur) * 0.1; // gentle smoothing on top of the scrub
      if (Math.abs(target - cur) < 0.001) cur = target;
      const n = letters.length;
      letters.forEach((s, i) => {
        const t = Math.max(0, Math.min(1, (cur * (n + SOFTNESS) - i) / SOFTNESS));
        s.style.color = mix(t);
      });
    });
    return unsubscribe;
  }, []);

  return (
    <p ref={ref} data-scroll-quote className={className} style={style}>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden>
        {lines.map((line, l) => {
          const words = line.split(" ");
          const content = words.map((word, w) => (
            <Fragment key={w}>
              {Array.from(word).map((char, c) => (
                <span key={c} data-letter style={{ color: mix(0) }}>
                  {char === "i" || char === "í" ? <em className="italic">{char}</em> : char}
                </span>
              ))}
              {w < words.length - 1 ? " " : null}
            </Fragment>
          ));
          // A forced line is a flex row around one inline run, so a line a
          // touch wider than the box still centres — its overhang split evenly
          // (text-align would push it all to one side).
          return lines.length > 1 ? (
            <span key={l} className="flex justify-center whitespace-nowrap">
              <span>{content}</span>
            </span>
          ) : (
            <Fragment key={l}>{content}</Fragment>
          );
        })}
      </span>
    </p>
  );
}
