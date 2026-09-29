import type { CSSProperties, ReactNode } from "react";
import { INTRO_DURATION, INTRO_EASE } from "./intro";

/**
 * The site's box entrance (the case intro, the home's mobile Capabilities
 * cards and Linha box): the box's top hairline fades in first; then the line
 * splits — one copy stays as the top border, the other rides down as the edge
 * of a curtain that opens the box from the top, on the site's entrance curve,
 * landing as the bottom border. Nothing inside has a timing of its own: each
 * piece appears as the curtain's edge reaches it, dropping into place the same
 * way (CURTAIN_DROP) — see `curtainPieceAt`. Inside a <Reveal> (or any
 * data-reveal="armed" parent) it all waits until the box scrolls into view.
 *
 * The box passed in must have no top border of its own (the hairline is it),
 * so nothing pops in with the curtain's first pixel.
 */
export function Curtain({
  at,
  lineAt,
  className,
  style,
  children,
}: {
  /** When the curtain sets off (s). */
  at: number;
  /** When the top hairline fades in (s) — CURTAIN_LEAD before `at`, usually. */
  lineAt: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={`relative ${className ?? ""}`} style={style}>
      <div className="curtain-block h-full" style={curtainTiming(at)}>
        {children}
      </div>
      <div
        aria-hidden
        className="line-in pointer-events-none absolute inset-x-0 top-0 h-px bg-line"
        style={{ animationDelay: `${lineAt.toFixed(2)}s` }}
      />
      <div aria-hidden className="curtain-edge pointer-events-none absolute inset-0 border-b border-line" style={curtainTiming(at)} />
    </div>
  );
}

/** The curtain sets off this long after its top hairline starts fading in (its 0.35s fade, globals.css). */
export const CURTAIN_LEAD = 0.3;

/** A piece inside a curtain drops into place (the blur profile's drop from above). */
export const CURTAIN_DROP = "rise rise-from-top";

/** Entrance timing (s) on the site's rhythm. */
export const curtainTiming = (delay: number): CSSProperties => ({
  animationDelay: `${delay.toFixed(2)}s`,
  animationDuration: INTRO_DURATION,
  animationTimingFunction: INTRO_EASE,
});

// The entrance curve and duration (globals.css --ease-enter / --dur-enter, mirrored here).
const ENTER_CURVE = [0.25, 0.1, 0.1, 1] as const;
const ENTER_DURATION = 1.4;
const LEAD = 0.05; // a piece starts this much before the edge reaches it (it begins transparent)

/** How long after the curtain sets off its edge reaches `p` of its height (0 = top, 1 = foot), in s. */
export function curtainReach(p: number) {
  const [x1, y1, x2, y2] = ENTER_CURVE;
  const bezier = (a: number, b: number, t: number) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 30; k++) {
    const mid = (lo + hi) / 2;
    if (bezier(y1, y2, mid) < p) lo = mid;
    else hi = mid;
  }
  return ENTER_DURATION * bezier(x1, x2, lo);
}

/** When a piece `p` of the way down a curtain that sets off at `at` should start (s). */
export const curtainPieceAt = (at: number, p: number) => at + Math.max(0, curtainReach(p) - LEAD);
