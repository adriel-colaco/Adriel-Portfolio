import ScrollQuote from "./ScrollQuote";
import ScrollLine, { MOBILE_LINE } from "./ScrollLine";
import Portrait from "./Portrait";

/**
 * Mobile "Linha" section (Figma 39:68) — the stacked counterpart of
 * LinhaSection: a 340px column with the black-and-white portrait, the quote
 * (filled letter by letter on scroll) and the hand-drawn line beneath it,
 * drawn at its own mobile size. No box and no entrance of its own: the
 * canvas's grid simply carries on through it, as on desktop. `cqw` on the
 * 360px mobile frame. `data-linha` scopes the line's scroll-chaining to this
 * section's own quote.
 */
const FRAME = 360;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

// MobileCanvas's grid strokes, relative to this 340px column (which starts at
// the frame's x = 10). The middle one stops at the portrait, clear of the quote.
const GRID_LINES = [0, 82.5, 170, 257.5, 340];
const GRID_STROKE = 1.5;
const PORTRAIT_TOP = 100;

export default function LinhaSectionMobile() {
  return (
    <div data-linha className="relative" style={{ width: u(340), height: u(833), marginInline: "auto" }}>
      {GRID_LINES.map((x) => (
        <span
          key={x}
          aria-hidden
          className="absolute top-0 bg-line"
          style={{
            left: `calc(${u(x)} - ${GRID_STROKE / 2}px)`,
            width: `${GRID_STROKE}px`,
            height: x === 170 ? u(PORTRAIT_TOP) : "100%",
          }}
        />
      ))}

      {/* Portrait, centred above the quote */}
      <Portrait
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
        style={{ top: u(PORTRAIT_TOP), width: u(120), height: u(120) }}
      />

      <ScrollQuote
        text="I believe design is about turning complexity into clarity"
        className="absolute text-center font-serif"
        style={{ left: u(10), top: u(240), width: u(320), fontSize: u(36), lineHeight: 1 }}
      />

      {/* Hand-drawn line — draws start→end on scroll */}
      <ScrollLine
        line={MOBILE_LINE}
        className="absolute"
        style={{ left: u(10), top: u(368), width: u(320), height: u(463) }}
      />
    </div>
  );
}
