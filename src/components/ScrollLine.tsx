"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { subscribe, prefersReducedMotion } from "./parallaxTicker";
import { QUOTE_START, QUOTE_SPAN } from "./ScrollQuote";

// Fraction of the line's own height over which its draw completes, once the
// quote has finished. Exported so the footer reveal can chain off the exact
// moment the line reaches its end, at any viewport size.
export const LINE_SPAN_FACTOR = 0.52;

// The desktop line (Figma 31:98), drawn in a 946×944 box at a 2px stroke —
// taller than the first cut (946×842), with a longer straight tail, so its
// draw spreads over more scroll instead of rushing past.
export const DESKTOP_LINE = { viewBox: "0 0 946 944", strokeWidth: 2, d:
  "M473.61 1C473.61 316.687 24.5631 -5.79312 1.55209 133.783C-6.63604 183.45 75.1683 267.671 322.494 344.991C530.298 409.958 849.077 427.692 926.972 318.359C1047.9 148.638 531.799 63.9287 234.41 307.16C-62.9796 550.39 9.8409 93.0074 227.571 182.623C363.395 238.526 457.282 270.249 616.547 277.789C922.556 292.282 1056.7 82.6788 779.151 58.0445C633.966 45.1586 285.677 144.984 615.482 301.415C307.575 301.415 482.502 501.953 603.794 376.569C735.081 240.849 448.636 143.98 342.931 301.415C250.69 438.797 422.201 475.464 465.61 473.514C509.016 471.563 489.003 436.634 455.733 449.164C422.463 461.693 404.56 521.954 431.502 618.887C464.48 737.539 473.038 847.765 473.038 942.497" };

// The mobile line (Figma 39:58): the same gesture redrawn at 320px wide with a
// 1.5px stroke — scaling the desktop one down left it a faint ~0.6px hairline.
// (Figma 1:156: taller than the first version, 320×463, so its draw has more
// scroll to play out over.)
export const MOBILE_LINE = { viewBox: "0 0 320 463", strokeWidth: 1.5, d:
  "M160.206 1C160.206 119.865 8.9375 -1.5578 1.1859 50.9967C-1.57239 69.6974 25.9846 101.409 109.3 130.522C179.301 154.984 286.687 161.662 312.927 120.495C353.662 56.59 179.807 24.6944 79.6276 116.278C-20.5525 207.861 3.9781 35.6434 77.3236 69.3861C123.078 90.4353 154.705 102.38 208.356 105.219C311.439 110.676 356.628 31.7544 263.131 22.4789C214.224 17.6269 96.8974 55.2141 207.997 114.115C104.274 114.115 163.201 189.623 204.06 142.412C248.286 91.31 151.792 54.8358 116.184 114.115C85.1117 165.843 142.887 179.649 157.51 178.915C172.133 178.18 165.391 165.028 154.183 169.746C142.976 174.464 136.945 197.154 146.021 233.652C157.13 278.328 160.013 319.831 160.013 355.5V463" };

// The blue's leading edge fades into the grey instead of ending on a cut:
// the last stretch of the drawn line is laid as short segments of rising
// transparency over the grey copy. SVG gradients can't follow a path, so the
// fade is built from the path itself.
const TAIL = 0.025; // fade length, as a fraction of the whole line
const TAIL_STEPS = 16; // segments in the fade

/**
 * The hand-drawn line under the quote. A grey copy shows the full path at rest;
 * a blue copy is drawn on top via stroke dashes, scrubbed by scroll so it fills
 * from start to end as the section passes through the viewport, its tip
 * fading into the grey. As the draw reaches the end, the fade closes up, so the
 * finished line is solid blue.
 */
export default function ScrollLine({
  className,
  style,
  line = DESKTOP_LINE,
}: {
  className?: string;
  style?: CSSProperties;
  line?: { viewBox: string; strokeWidth: number; d: string };
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawRef = useRef<SVGPathElement>(null);
  const tailRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = drawRef.current;
    const tail = tailRef.current;
    if (!wrap || !path || !tail) return;
    const len = path.getTotalLength();
    const segments = Array.from(tail.children) as SVGPathElement[];

    // Lays the blue up to `drawn` (path units): solid, then the fading tip.
    // Also publishes how far the draw has actually got (`data-drawn`, 0–1), so
    // the footer's circle can wait for the line to really finish.
    const draw = (drawn: number) => {
      wrap.dataset.drawn = (drawn / len).toFixed(4);
      const fade = Math.max(0, Math.min(len * TAIL, drawn, len - drawn));
      const solid = drawn - fade;
      // (Hidden when empty: a zero-length dash would still paint its square cap.)
      path.style.visibility = solid > 0.01 ? "visible" : "hidden";
      path.style.strokeDasharray = `${solid} ${len}`;
      const step = fade / TAIL_STEPS;
      segments.forEach((seg, i) => {
        seg.style.strokeDasharray = `0 ${solid + i * step} ${step} ${len}`;
      });
    };

    if (prefersReducedMotion()) {
      draw(len);
      return;
    }

    draw(0);
    let cur = 0;
    return subscribe(() => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Chain off the quote: the draw only begins once the title has finished
      // turning blue, then fills over a short scroll window (×0.52 of the line's
      // height) so it completes well before the tall SVG scrolls off screen.
      const span = r.height * LINE_SPAN_FACTOR;
      // Scope the quote lookup to this line's own Linha section, so the desktop
      // and mobile sections each chain to their own quote (both carry the same
      // attributes; a document-wide query would always hit the first one).
      const scope = wrap.closest<HTMLElement>("[data-linha]") ?? document;
      const quote = scope.querySelector<HTMLElement>("[data-scroll-quote]");
      let target: number;
      if (quote) {
        // Scroll travelled past the point where the title's fill completes.
        const past =
          QUOTE_START * vh - quote.getBoundingClientRect().top - QUOTE_SPAN * vh;
        target = Math.max(0, Math.min(1, past / span));
      } else {
        const refY = vh * 0.62;
        target = Math.max(0, Math.min(1, (refY - r.top) / span));
      }
      cur += (target - cur) * 0.18;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      draw(len * cur);
    });
  }, []);

  return (
    <div ref={wrapRef} data-scroll-line className={className} style={style} aria-hidden>
      <svg viewBox={line.viewBox} fill="none" className="block h-full w-full" overflow="visible">
        <path
          d={line.d}
          stroke="#d4d4d8"
          strokeWidth={line.strokeWidth}
          strokeMiterlimit={1.5}
          strokeLinecap="square"
          strokeLinejoin="round"
        />
        <path
          ref={drawRef}
          d={line.d}
          stroke="#001fff"
          strokeWidth={line.strokeWidth}
          strokeMiterlimit={1.5}
          strokeLinecap="square"
          strokeLinejoin="round"
        />
        {/* The fading tip: blue segments, each a little more transparent,
            butt-capped so they meet edge to edge. */}
        <g ref={tailRef}>
          {Array.from({ length: TAIL_STEPS }, (_, i) => (
            <path
              key={i}
              d={line.d}
              stroke="#001fff"
              strokeOpacity={1 - (i + 0.5) / TAIL_STEPS}
              strokeWidth={line.strokeWidth}
              strokeLinecap="butt"
              strokeLinejoin="round"
              style={{ strokeDasharray: `0 ${1e6}` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
