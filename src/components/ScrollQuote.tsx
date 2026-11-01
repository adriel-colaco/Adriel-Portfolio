"use client";

import type { CSSProperties } from "react";
import { Fragment, useEffect, useRef } from "react";
import { subscribe, prefersReducedMotion } from "./parallaxTicker";

// Scroll window (as fractions of the viewport height) over which the letters appear.
// Exported so the line can chain off it and start exactly when the text is done.
export const QUOTE_START = 0.95; // fill begins when the text top sits this high (earlier in the scroll; the line chains off this so it starts sooner too)
export const QUOTE_SPAN = 0.75; // …and completes this much scrolling later

// Each letter takes this many letters' worth of scroll to come into focus, so
// while one starts to appear the dozen before it are still clearing — a long,
// soft sweep rather than a letter-by-letter cut.
const SOFTNESS = 14;
// A letter comes in where it stands — no travel, no scale — just out of a blur
// and into full opacity, so the sentence reads as coming into focus.
const BLUR = 10; // px, at the start

/** A letter `t` (0–1) of the way in: eased, so it settles rather than stops. */
function letterStyle(s: HTMLElement, t: number) {
  const e = 1 - (1 - t) ** 3; // ease-out
  s.style.opacity = e.toFixed(3);
  s.style.filter = e < 0.995 ? `blur(${(BLUR * (1 - e)).toFixed(2)}px)` : "";
}

/**
 * The quote, written out by the scroll: as it scrolls up, its letters come in
 * left to right, one after another — each coming into focus where it stands,
 * out of a blur — scrubbed by scroll position. The
 * sweep is spread over most of a viewport of scrolling so its pace reads as
 * tied to the scroll rather than snapping. Every "i" is set in italic (the
 * site's flourish). Under reduced motion the text is simply there.
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
      letters.forEach((s) => letterStyle(s, 1));
      return;
    }

    let cur = 0;
    let drawn = -1;
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
      if (cur === drawn) return; // nothing moved: leave the letters be
      drawn = cur;
      const n = letters.length;
      letters.forEach((s, i) => {
        const t = Math.max(0, Math.min(1, (cur * (n + SOFTNESS) - i) / SOFTNESS));
        letterStyle(s, t);
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
              {/* A word never breaks: its letters (each its own box, to blur
                  separately) are kept together on one line. */}
              <span className="inline-block whitespace-nowrap">
                {Array.from(word).map((char, c) => (
                  <span key={c} data-letter className="inline-block text-ink" style={{ opacity: 0 }}>
                    {char === "i" || char === "í" ? <em className="italic">{char}</em> : char}
                  </span>
                ))}
              </span>
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
