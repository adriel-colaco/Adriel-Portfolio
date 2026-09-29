"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./parallaxTicker";
import { markSiteLoaded } from "./siteLoaded";

// The count flows through a few soft stages instead of one linear ramp: at each
// checkpoint the target moves ahead, and the number chases it like a critically
// damped spring — easing in and out, never fully stopping — so it reads as a
// smooth, slightly breathing load. Unhurried on purpose: about 3.4s to 100%,
// with a little random jitter per load. `at` is in ms from the start.
const CHECKPOINTS = [
  { at: 0, to: 36 },
  { at: 1050, to: 69 },
  { at: 2000, to: 100 },
];
const OMEGA = 4.6; // spring stiffness (rad/s): lower = softer, calmer
// The final stretch waits for the web fonts (holding near 92%), never past MAX_MS.
const MAX_MS = 4500;
const LIFT_MS = 1100; // keep in sync with .site-loader transition in globals.css
// The fill's leading edge fades into the dark track (like the Linha line's
// tip): the fade's length, as a fraction of the hairline. It opens up as the
// fill leaves the start and closes as it reaches the end, so 100% is solid.
const FILL_FADE = 0.12;
const FILL = "#e0e0e0";
const LAND_MS = 450; // beat on "100%" (long enough for the wheels to settle) before the curtain goes up

// The percentage is an odometer, like React Bits' Counter: one wheel of 0–9 per
// place, each rolling on its own spring to floor(count / place), so the ones
// spin with the count and the tens/hundreds click over as it passes them.
// Leading zeros stay hidden until the count reaches their place.
const PLACES = [100, 10, 1];
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const WHEEL_K = 160; // wheel spring stiffness
const WHEEL_C = 2 * 0.85 * Math.sqrt(WHEEL_K); // damping: just under critical, a soft landing

// Each wheel's window reaches WINDOW_BLEED above and below the digit's 1em line
// and fades out across that bleed (a mask, like the Counter's top/bottom
// gradients), so a digit rolling out softens instead of being cut at the edge.
// The resting digit's ink sits well inside the solid middle, so the fade only
// ever shows in motion. Digits are spaced DIGIT_SPACING apart on the wheel so
// the neighbours stay out of the taller window at rest.
const WINDOW_BLEED = 0.25; // em
const DIGIT_SPACING = 1.5; // em
// Each window is as wide as the digit it shows (the serif's "1" is far narrower
// than its "0"), easing between widths as the wheel rolls — so "100%" sets with
// natural spacing instead of each digit centred in a fixed "0"-wide slot. A
// small side bleed keeps a wide digit from being cut while its window narrows.
const SIDE_BLEED = 0.15; // em
const WIDTH_EASE = 0.25; // per-frame easing of a window's width
const FADE = `${((WINDOW_BLEED / (1 + 2 * WINDOW_BLEED)) * 100).toFixed(1)}%`;
const WINDOW_MASK = `linear-gradient(to bottom, transparent, #000 ${FADE}, #000 calc(100% - ${FADE}), transparent)`;

// Where digit `n` sits on a wheel at position `pos`, in em: 0 is centred in the
// window, neighbours stack above/below, wrapping 9→0.
const wheelOffset = (n: number, pos: number) => {
  const offset = (10 + n - (pos % 10)) % 10;
  return (offset > 5 ? offset - 10 : offset) * DIGIT_SPACING;
};

const jitter = (n: number, amount: number) => n + (Math.random() * 2 - 1) * amount;

/**
 * Full-screen blue loading screen: a full-width hairline that fills left→right
 * and a big serif percentage bottom-right. Rendered on the server so it covers
 * the page from the first paint. While it's up (`data-state="loading"`), the
 * site's CSS entrance animations are paused (see globals.css), so they play as
 * the curtain rises rather than underneath it.
 */
export default function SiteLoader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLParagraphElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const fill = fillRef.current;
    const pctEl = pctRef.current;
    if (!root || !fill || !pctEl) return;

    // Already shown this visit: CSS keeps it hidden, and there's nothing to run.
    if ("siteLoaded" in document.documentElement.dataset) return;

    const body = document.body;
    const prevOverflow = body.style.overflow;
    let raf = 0;
    let removeTimer = 0;

    const lift = () => {
      root.dataset.state = "lifting";
      body.style.overflow = prevOverflow;
      removeTimer = window.setTimeout(() => {
        markSiteLoaded();
        setGone(true);
      }, LIFT_MS + 50);
    };

    if (prefersReducedMotion()) {
      // No count, no curtain (the screen is hidden via CSS under reduced motion).
      lift();
      return () => window.clearTimeout(removeTimer);
    }

    body.style.overflow = "hidden";

    let fontsReady = false;
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      fontsReady = true;
    });

    const checkpoints = CHECKPOINTS.map((c, i) => ({
      at: i === 0 ? 0 : jitter(c.at, 70),
      to: c.to === 100 ? 100 : Math.round(jitter(c.to, 3)),
    }));

    const wheels = PLACES.map((place) => {
      const el = pctEl.querySelector<HTMLElement>(`[data-place="${place}"]`)!;
      return { place, el, digits: Array.from(el.querySelectorAll<HTMLElement>("[data-digit]")), x: 0, v: 0, width: 0 };
    });

    // Each digit's advance width (em), measured in the real font; re-measured
    // once the web fonts are in, since the fallback's figures differ.
    const measureDigits = () => {
      const probe = document.createElement("span");
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap";
      pctEl.appendChild(probe);
      const fs = parseFloat(getComputedStyle(pctEl).fontSize);
      const widths = DIGITS.map((n) => {
        probe.textContent = String(n);
        return probe.getBoundingClientRect().width / fs;
      });
      probe.remove();
      return widths;
    };
    let digitWidths = measureDigits();
    document.fonts?.ready.then(() => {
      digitWidths = measureDigits();
    });
    // The width a wheel's window should have right now: the shown digit's, or a
    // blend of the two passing through while it rolls; nothing while hidden.
    const windowWidth = (w: (typeof wheels)[number]) => {
      if (w.place !== 1 && Math.floor(shown) < w.place) return 0;
      const base = Math.floor(w.x);
      const d0 = ((base % 10) + 10) % 10;
      return digitWidths[d0] + (digitWidths[(d0 + 1) % 10] - digitWidths[d0]) * (w.x - base);
    };

    const start = performance.now();
    let last = start;
    let x = 0; // spring position (percent)
    let v = 0; // spring velocity
    let shown = 0;
    let landed = false;

    const render = (settle = false) => {
      // A full-width fill slid in from the left (not scaled, so its fading tip
      // keeps its length), clipped by the track.
      const p = shown / 100;
      const fade = Math.max(0, Math.min(FILL_FADE, p, 1 - p));
      fill.style.transform = `translateX(${((p - 1) * 100).toFixed(3)}%)`;
      fill.style.backgroundImage = `linear-gradient(to right, ${FILL} ${((1 - fade) * 100).toFixed(2)}%, rgb(224 224 224 / 0) 100%)`;
      for (const w of wheels) {
        w.el.style.opacity = w.place === 1 || Math.floor(shown) >= w.place ? "1" : "0";
        const target = windowWidth(w);
        w.width = settle ? target : w.width + (target - w.width) * WIDTH_EASE;
        w.el.style.width = `${(w.width + 2 * SIDE_BLEED).toFixed(4)}em`;
        w.digits.forEach((d, n) => {
          d.style.transform = `translateY(${wheelOffset(n, w.x).toFixed(4)}em)`;
        });
      }
    };

    const tick = (now: number) => {
      const t = now - start;
      let target = 0;
      for (const c of checkpoints) if (t >= c.at) target = c.to;
      if (target === 100 && !fontsReady && t < MAX_MS) target = 92;

      // Integrate in small sub-steps (stable even when frames arrive late, e.g.
      // in a background tab — it simply catches up).
      let dt = Math.min((now - last) / 1000, 1);
      last = now;
      while (dt > 0) {
        const h = Math.min(dt, 1 / 120);
        if (!landed) {
          v += (OMEGA * OMEGA * (target - x) - 2 * OMEGA * v) * h;
          x += v * h;
          shown = Math.min(100, Math.max(shown, x)); // never goes backwards
        }
        for (const w of wheels) {
          w.v += (WHEEL_K * (Math.floor(shown / w.place) - w.x) - WHEEL_C * w.v) * h;
          w.x += w.v * h;
        }
        dt -= h;
      }

      if (!landed && target === 100 && shown >= 99.6) {
        landed = true;
        shown = 100;
        removeTimer = window.setTimeout(lift, LAND_MS);
      }

      // Once landed, keep rolling until every wheel has settled on its digit.
      const settled = wheels.every((w) => Math.abs(Math.floor(shown / w.place) - w.x) < 0.001 && Math.abs(w.v) < 0.01);
      if (landed && settled) {
        for (const w of wheels) w.x = Math.floor(shown / w.place);
        render(true);
        return;
      }
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(removeTimer);
      body.style.overflow = prevOverflow;
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      data-state="loading"
      data-cursor-dark
      aria-hidden
      // Desktop: the hairline and the count sit at the bottom, the count
      // right-aligned under the line. Mobile: the hairline is centred on the
      // screen and the (bigger) count hangs below it on the right.
      className="site-loader flex flex-col justify-center bg-ink landscape-tablet:justify-end landscape-tablet:gap-[max(24px,3.6vw)] landscape-tablet:pb-[max(20px,3.5vw)]"
    >
      {/* Without JS the curtain could never lift, so drop it and let the CSS
          entrances run as usual. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>.site-loader{display:none!important}.split-word,.rise{animation-play-state:running!important}</style>",
        }}
      />

      {/* Progress hairline: dark track, off-white fill coming in from the
          left, its tip fading into the track */}
      {/* (The track is a translucent black, so on the blue it reads as a quiet
          darker blue rather than a near-black line.) */}
      <div className="relative h-px w-full overflow-hidden" style={{ backgroundColor: "rgb(0 0 0 / 0.3)" }}>
        <div ref={fillRef} className="absolute inset-0" style={{ transform: "translateX(-100%)" }} />
      </div>

      {/* On mobile the count is taken out of the flow (so the hairline alone
          is what's centred) and hung 32px below it. */}
      <p
        ref={pctRef}
        className="absolute right-5 top-[calc(50%+32px)] font-serif text-[88px] leading-none [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] landscape-tablet:static landscape-tablet:self-end landscape-tablet:pr-[max(20px,3.5vw)] landscape-tablet:text-[max(48px,6.4vw)]"
        style={{ color: "#e0e0e0" }}
      >
        {/* One masked window per place; the hidden "0" gives it the width
            and baseline of a digit, and the wheel's digits slide inside it.
            The window's bleed is padding cancelled by negative margin, so the
            line box — and the number's position — stay exactly as before. */}
        {PLACES.map((place) => (
          <span
            key={place}
            data-place={place}
            className="relative inline-block transition-opacity duration-(--dur-hover) ease-(--ease-fade)"
            style={{
              opacity: place === 1 ? 1 : 0,
              paddingBlock: `${WINDOW_BLEED}em`,
              marginBlock: `-${WINDOW_BLEED}em`,
              paddingInline: `${SIDE_BLEED}em`,
              marginInline: `-${SIDE_BLEED}em`,
              maskImage: WINDOW_MASK,
              WebkitMaskImage: WINDOW_MASK,
            }}
          >
            <span className="invisible">0</span>
            {DIGITS.map((n) => (
              <span
                key={n}
                data-digit
                className="absolute inset-x-0 text-center"
                style={{ top: `${WINDOW_BLEED}em`, transform: `translateY(${wheelOffset(n, 0)}em)` }}
              >
                {n}
              </span>
            ))}
          </span>
        ))}
        %
      </p>
    </div>
  );
}
