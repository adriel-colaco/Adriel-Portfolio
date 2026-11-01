import type { CSSProperties } from "react";

/**
 * The glow at the top of the page, under the header (Figma 1:103): four
 * blurred ellipses of screen light — brand blue and orange — drifting like the
 * reflection of a video (.top-glow, globals.css).
 *
 * The Figma's 1440 composition, scaled uniformly by `scale` (positions, sizes
 * and blur together, so it keeps the desktop's exact softness) and centred on
 * the canvas — on a narrower canvas, a centred crop of a smaller copy of it,
 * rather than the lights squeezed to the width and melting into one colour.
 * `unit` turns the canvas's design px into a length; `frame` is its width. On
 * a phone `spread` draws the lights a little closer together than their size
 * would, so the blues at the sides still make it onto the narrow screen.
 */
// From the Figma: each ellipse's centre and radii (design px), colour, and its
// own wander/flicker loop. Each is drawn as the Figma draws it: a solid
// ellipse under a 150px (σ) Gaussian blur.
const LIGHTS = [
  { x: 93, y: -78, rx: 552, ry: 236, c: "#001fff", wander: "a", wd: 10.6, fd: 7.4, delay: -1.2 },
  { x: 841, y: -177, rx: 552, ry: 236, c: "#ff6a00", wander: "b", wd: 12.2, fd: 5.8, delay: -3.4 },
  { x: -244, y: -17, rx: 382, ry: 175, c: "#ff6a00", wander: "c", wd: 9.4, fd: 8.6, delay: -0.6 },
  { x: 1486, y: -52, rx: 303, ry: 236, c: "#001fff", wander: "b", wd: 14.6, fd: 6.6, delay: -5.1 },
] as const;
const BLUR = 150;

// How far the glow reaches above the page's top edge, out of the normal view:
// it's what a rubber-band scroll past the top uncovers, so pulling down shows
// the glow carrying on upward instead of a flat band of the page's background.
const ABOVE = 400;

const DESIGN = 1440; // the Figma frame's width
const BOX = 640; // the glow's height on it, below the page's top edge

export default function TopGlow({
  unit,
  frame,
  scale,
  spread = scale,
  tall = 1,
}: {
  unit: (px: number) => string;
  frame: number;
  scale: number;
  /** How far apart the lights sit (default: `scale`, the exact composition). */
  spread?: number;
  /** Stretches the composition downward (positions and heights, not the blur),
   *  so the glow reaches further down the page without getting any harder. */
  tall?: number;
}) {
  // Design px → the canvas's px: scaled about the design's centre line, which
  // lands on the canvas's centre line.
  const x = (px: number) => unit(frame / 2 + (px - DESIGN / 2) * spread);
  const d = (px: number) => unit(px * scale);
  const v = (px: number) => d(px * tall);
  return (
    <div
      aria-hidden
      className="top-glow pointer-events-none absolute inset-x-0"
      style={{ top: v(-ABOVE), height: v(BOX + ABOVE), "--glow-above": `${((ABOVE * 100) / (BOX + ABOVE)).toFixed(2)}%` } as CSSProperties}
    >
      {LIGHTS.map((l, i) => (
        <div
          key={i}
          className="top-glow-light"
          style={
            {
              left: x(l.x),
              top: v(l.y + ABOVE),
              width: d(l.rx * 2),
              height: v(l.ry * 2),
              backgroundColor: l.c,
              filter: `blur(${d(BLUR)})`,
              "--wander": `top-glow-wander-${l.wander}`,
              "--wd": `${l.wd}s`,
              "--fd": `${l.fd}s`,
              "--delay": `${l.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
