/**
 * Seals hung from a project card's top-right corner, like bookmark ribbons
 * (the OnProfit card's "Gr" and "Ai"): each a tab with a V notch cut into its
 * foot, cut close around its label. They sit on the card's image frame,
 * outside the drifting image, so they stay put in the corner while the photo
 * moves and zooms.
 *
 * With `enter`, the ribbons drop in from behind the frame's top edge
 * (`.drop-block`), one `step` after the other from `at` seconds — inside a
 * <Reveal> they wait until it scrolls into view.
 *
 * On hover a ribbon slides a little further down (it's drawn longer than it
 * shows, running up past the frame's top edge, which clips it — so it reads
 * as the ribbon lengthening, not coming loose) and, when it has a `feature`, a
 * tooltip opens under it, like Behance's: "Featured on Behance" and the
 * gallery that featured the project.
 *
 * Sizes are in design px, passed through the canvas's own `cqw` helper.
 */
import type { CSSProperties } from "react";
import { INTRO_DURATION, INTRO_EASE } from "./intro";

export type Seal = {
  label: string;
  bg: string;
  fg: string;
  /** The Behance gallery that featured the project (the hover tooltip). */
  feature?: string;
  /** When it was featured, as it should read (optional). */
  date?: string;
};

// The ribbon, drawn in a 50×72 box: the notch's point sits 12 up from the foot.
// It runs RUN_UP above the box, out of sight until the hover slides it down.
const VIEW_W = 50;
const VIEW_H = 72;
const RUN_UP = 24;
const RIBBON = `M0 -${RUN_UP}H50V72L25 60L0 72Z`;

const HOVER_DROP = 6; // how far a ribbon slides down on hover (design px; < RUN_UP in px)
// The tooltip, after Behance's featured card: white, rounded, a soft shadow
// shared with its pointer, an uppercase grey "Featured on Behance" over the
// gallery in the site's blue — set in the site's mono (semibold, as Behance's
// bold sans). A small, fixed size in screen px (not the canvas's scale): it's
// interface, so it reads the same on a phone as on a wide screen.
const TIP_GAP = 8; // px from the dropped ribbon to its pointer's tip
const CARET_W = 12; // px: the pointer, a small triangle pointing up at the ribbon
const CARET_H = 6;

export default function Seals({
  seals,
  unit,
  width,
  textSize,
  side = "right",
  inset = 12,
  enter,
}: {
  seals: Seal[];
  unit: (px: number) => string;
  /** Ribbon width in design px. */
  width: number;
  /** Label size in design px. */
  textSize: number;
  /** Which top corner they hang from. */
  side?: "left" | "right";
  /** Distance from that side, in design px. */
  inset?: number;
  /** The ribbons' entrance: the first drops at `at` (s), each next `step` later. */
  enter?: { at: number; step?: number };
}) {
  const entrance = (i: number): CSSProperties | undefined =>
    enter && {
      animationDelay: `${(enter.at + i * (enter.step ?? 0.08)).toFixed(2)}s`,
      animationDuration: INTRO_DURATION,
      animationTimingFunction: INTRO_EASE,
    };

  return (
    <div
      className={`absolute top-0 z-10 flex ${side === "right" ? "right-0" : "left-0"}`}
      style={{ gap: unit(8), [side === "right" ? "paddingRight" : "paddingLeft"]: unit(inset) }}
    >
      {seals.map((seal, i) => (
        // The entrance (if any) moves this wrapper; the hover moves the ribbon
        // inside it, so the two never fight over one transform.
        <span
          key={seal.label}
          data-cursor-plain
          className={`group/seal relative block ${enter ? "drop-block" : ""}`}
          style={{ "--seal-drop": unit(HOVER_DROP), ...entrance(i) } as CSSProperties}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            role="img"
            aria-label={seal.feature ? `${seal.label}: featured on Behance in ${seal.feature}` : seal.label}
            className="block overflow-visible transition-transform duration-(--dur-ui) ease-(--ease-ui) group-hover/seal:translate-y-(--seal-drop)"
            style={{ width: unit(width), height: unit((width * VIEW_H) / VIEW_W) }}
          >
            <path d={RIBBON} fill={seal.bg} />
            <text
              x={VIEW_W / 2}
              y="34"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={seal.fg}
              fontFamily="ui-sans-serif, system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
              fontWeight={600}
              fontSize={(textSize * VIEW_W) / width}
            >
              {seal.label}
            </text>
          </svg>

          {seal.feature && (
            // Opens toward the card's inside (anchored to the ribbon's outer
            // side), so it never runs off the frame, which would clip it; the
            // pointer sits over the ribbon's centre. One drop shadow for the
            // card and its pointer together, as on Behance.
            <span
              aria-hidden
              className="pointer-events-none absolute top-full w-max -translate-y-1 opacity-0 drop-shadow-[0_2px_8px_rgb(0_0_0/0.14)] transition-[opacity,translate] duration-(--dur-ui) ease-(--ease-ui) group-hover/seal:translate-y-0 group-hover/seal:opacity-100"
              style={{ [side]: 0, marginTop: `calc(${unit(HOVER_DROP)} + ${TIP_GAP}px)` }}
            >
              <span
                className="absolute bg-white [clip-path:polygon(50%_0,100%_100%,0_100%)]"
                style={{
                  top: -CARET_H + 0.5,
                  [side]: `calc(${unit(width / 2)} - ${CARET_W / 2}px)`,
                  width: CARET_W,
                  height: CARET_H,
                }}
              />
              <span
                className="flex flex-col gap-1.5 rounded-lg bg-white px-3 py-2.5 font-mono font-semibold leading-none"
              >
                <span className="text-[10px] uppercase tracking-[0.02em] text-muted">Featured on Behance</span>
                <span className="text-[13px] tracking-[-0.02em] text-ink">
                  {seal.feature}
                  {seal.date && (
                    <span className="font-normal text-muted">
                      {" "}
                      — {seal.date}
                    </span>
                  )}
                </span>
              </span>
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
