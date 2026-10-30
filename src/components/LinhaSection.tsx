import ScrollQuote from "./ScrollQuote";
import ScrollLine from "./ScrollLine";
import Portrait from "./Portrait";

/**
 * The "Linha" section (Figma nodes 31:95–31:99): a container holding a small
 * black-and-white portrait, the scroll-filled quote, and the hand-drawn line
 * beneath it. It flows right after the DesktopCanvas's last card row. Dimensions are `cqw` (100cqw = the 1440px frame), matching
 * the rest of the DesktopCanvas.
 */
const FRAME = 1440;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

// The quote is set at line-height 1 (like the hero heading) rather than Figma's
// 0.9, which makes its three lines this much taller; the line and the section
// grow by the same amount so every gap around the quote stays as designed.
const QUOTE_SIZE = 72;
const QUOTE_LINES = 3;
const QUOTE_LEADING = 1;
const EXTRA = QUOTE_SIZE * QUOTE_LINES * (QUOTE_LEADING - 0.9);

// The line's box: 944 wide, and tall enough to hold its 946×944 drawing at the
// same scale the first (946×842) one had in a 739px-tall box — so the section
// grows by the taller tail, and the line still ends at the section's bottom
// edge, where the footer's circle starts.
const LINE_H = (944 * 739) / 842;
const LINE_EXTRA = LINE_H - 739;

// Grid strokes in the section's 1400px box, which starts at the frame's x = 20
// (the frame's 20, 365, 1075, 1420).
const GRID_LINES = [0, 345, 1055, 1400];
const GRID_STROKE = 1.5;
const PORTRAIT_TOP = 200;

export default function LinhaSection() {
  return (
    <div
      data-linha
      // No background of its own: the cards above drift into its top.
      className="relative"
      style={{ width: u(1400), height: u(1324 + EXTRA + LINE_EXTRA), marginInline: "auto" }}
    >
      {/* The home's background grid carries on through the section. */}
      {GRID_LINES.map((x) => (
        <span
          key={x}
          aria-hidden
          className="absolute top-0 bottom-0 bg-line"
          style={{ left: `calc(${u(x)} - ${GRID_STROKE / 2}px)`, width: `${GRID_STROKE}px` }}
        />
      ))}
      {/* The middle stroke runs on down to the portrait and stops there (Figma),
          clear of the quote. */}
      <span
        aria-hidden
        className="absolute top-0 bg-line"
        style={{ left: `calc(${u(700)} - ${GRID_STROKE / 2}px)`, width: `${GRID_STROKE}px`, height: u(PORTRAIT_TOP) }}
      />

      {/* Portrait (Rectangle 6) — centred above the quote */}
      <Portrait
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
        style={{ top: u(PORTRAIT_TOP), width: u(140), height: u(140) }}
      />

      {/* Quote + decorative line — both scrub on scroll: the quote fills
          letter-by-letter grey→blue, the line draws start→end. The line breaks
          are fixed to Figma's (31:96): with the italic i's the first line runs
          a touch wider than the 574px box, so left to the browser it would
          wrap early. Centred, the overhang is shared evenly by both sides. */}
      <ScrollQuote
        text={"I believe design is about\nturning complexity\ninto clarity"}
        className="absolute text-center font-serif"
        style={{
          left: u(413),
          top: u(370),
          width: u(574),
          fontSize: u(QUOTE_SIZE),
          lineHeight: QUOTE_LEADING,
        }}
      />
      <ScrollLine
        className="absolute"
        style={{ left: u(228), top: u(585 + EXTRA), width: u(944), height: u(LINE_H) }}
      />
    </div>
  );
}
