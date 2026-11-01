"use client";

import type { CSSProperties } from "react";
import { useEffect, useId, useRef } from "react";
import { subscribe, prefersReducedMotion } from "./parallaxTicker";
import { QUOTE_START, QUOTE_SPAN } from "./ScrollQuote";

// Fraction of the line's own height over which its draw completes, once the
// quote has finished. Exported so the footer reveal can chain off the exact
// moment the line reaches its end, at any viewport size.
export const LINE_SPAN_FACTOR = 0.52;

// The desktop line (Figma 31:98), drawn in a 946×944 box at a 1.5px stroke —
// taller than the first cut (946×842), with a longer straight tail, so its
// draw spreads over more scroll instead of rushing past.
export const DESKTOP_LINE = { viewBox: "0 0 946 944", strokeWidth: 1.5, d:
  "M473.61 1C473.61 316.687 24.5631 -5.79312 1.55209 133.783C-6.63604 183.45 75.1683 267.671 322.494 344.991C530.298 409.958 849.077 427.692 926.972 318.359C1047.9 148.638 531.799 63.9287 234.41 307.16C-62.9796 550.39 9.8409 93.0074 227.571 182.623C363.395 238.526 457.282 270.249 616.547 277.789C922.556 292.282 1056.7 82.6788 779.151 58.0445C633.966 45.1586 285.677 144.984 615.482 301.415C307.575 301.415 482.502 501.953 603.794 376.569C735.081 240.849 448.636 143.98 342.931 301.415C250.69 438.797 422.201 475.464 465.61 473.514C509.016 471.563 489.003 436.634 455.733 449.164C422.463 461.693 404.56 521.954 431.502 618.887C464.48 737.539 473.038 847.765 473.038 942.497" };

// The mobile line (Figma 39:58): the same gesture redrawn at 320px wide with a
// 1.5px stroke — scaling the desktop one down left it a faint ~0.6px hairline.
// (Figma 1:156: taller than the first version, 320×463, so its draw has more
// scroll to play out over.)
export const MOBILE_LINE = { viewBox: "0 0 320 463", strokeWidth: 1.5, d:
  "M160.206 1C160.206 119.865 8.9375 -1.5578 1.1859 50.9967C-1.57239 69.6974 25.9846 101.409 109.3 130.522C179.301 154.984 286.687 161.662 312.927 120.495C353.662 56.59 179.807 24.6944 79.6276 116.278C-20.5525 207.861 3.9781 35.6434 77.3236 69.3861C123.078 90.4353 154.705 102.38 208.356 105.219C311.439 110.676 356.628 31.7544 263.131 22.4789C214.224 17.6269 96.8974 55.2141 207.997 114.115C104.274 114.115 163.201 189.623 204.06 142.412C248.286 91.31 151.792 54.8358 116.184 114.115C85.1117 165.843 142.887 179.649 157.51 178.915C172.133 178.18 165.391 165.028 154.183 169.746C142.976 174.464 136.945 197.154 146.021 233.652C157.13 278.328 160.013 319.831 160.013 355.5V463" };

// The line comes into focus as it's drawn, like the quote above it: its
// leading stretch is laid as short segments, each a little more transparent
// and more blurred toward the tip, so the stroke emerges out of a blur and
// sharpens behind it over a long, soft run. SVG gradients and filters can't
// follow a path, so the fade is built from the path itself; segments share
// one of BLUR_LEVELS blur filters (grouped, so only that many are filtered).
const TAIL = 0.09; // the focusing stretch, as a fraction of the whole line
const TAIL_STEPS = 64; // segments in it
const BLUR_LEVELS = 16;
const MAX_BLUR = 10; // px on screen, at the tip — for the desktop's ~540px-wide line
const BLUR_REF_W = 540; // a smaller line gets proportionally less (else it smears)

/**
 * The hand-drawn line under the quote, drawn by the scroll: nothing shows at
 * rest; the blue is laid via stroke dashes, scrubbed by scroll from start to
 * end as the section passes through the viewport, its tip emerging out of a
 * blur and sharpening behind it. As the draw reaches the end, the soft stretch
 * closes up, so the finished line is solid and sharp.
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
  const blurId = useId().replace(/[^a-zA-Z0-9-]/g, "");

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = drawRef.current;
    const tail = tailRef.current;
    if (!wrap || !path || !tail) return;
    const len = path.getTotalLength();
    // Segments in order along the line (they sit in groups, one per blur level).
    const segments = Array.from(tail.querySelectorAll<SVGPathElement>("path")).sort(
      (a, b) => +a.dataset.i! - +b.dataset.i!,
    );
    // The blurs are in the drawing's units: scale them so they read as MAX_BLUR
    // screen px whatever size the line is drawn at.
    const toUnits = line.viewBox.split(" ").map(Number)[2] / (wrap.clientWidth || 1);
    // (The filters live in the SVG's <defs>, outside the tail group.)
    wrap.querySelectorAll("feGaussianBlur").forEach((f, k) => {
      const maxBlur = MAX_BLUR * Math.min(1, (wrap.clientWidth || BLUR_REF_W) / BLUR_REF_W);
      f.setAttribute("stdDeviation", String((maxBlur * ((k + 1) / BLUR_LEVELS) * toUnits).toFixed(2)));
    });

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
  }, [line.viewBox]);

  // Segment i (0 = the sharpest, next to the solid line) → its blur level.
  const levelOf = (i: number) => Math.min(BLUR_LEVELS - 1, Math.floor((i / TAIL_STEPS) * BLUR_LEVELS));

  return (
    <div ref={wrapRef} data-scroll-line className={className} style={style} aria-hidden>
      <svg viewBox={line.viewBox} fill="none" className="block h-full w-full" overflow="visible">
        <defs>
          {Array.from({ length: BLUR_LEVELS }, (_, k) => (
            <filter key={k} id={`${blurId}-${k}`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0" />
            </filter>
          ))}
        </defs>
        <path
          ref={drawRef}
          d={line.d}
          stroke="#001fff"
          strokeWidth={line.strokeWidth}
          strokeMiterlimit={1.5}
          strokeLinecap="square"
          strokeLinejoin="round"
        />
        {/* The focusing tip: blue segments, each a little more transparent and
            (by group) more blurred, butt-capped so they meet edge to edge. */}
        <g ref={tailRef}>
          {Array.from({ length: BLUR_LEVELS }, (_, k) => (
            <g key={k} filter={`url(#${blurId}-${k})`}>
              {Array.from({ length: TAIL_STEPS }, (_, i) => i)
                .filter((i) => levelOf(i) === k)
                .map((i) => (
                  <path
                    key={i}
                    data-i={i}
                    d={line.d}
                    stroke="#001fff"
                    strokeOpacity={(1 - (i + 0.5) / TAIL_STEPS) ** 1.4}
                    strokeWidth={line.strokeWidth}
                    strokeLinecap="butt"
                    strokeLinejoin="round"
                    style={{ strokeDasharray: `0 ${1e6}` }}
                  />
                ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
