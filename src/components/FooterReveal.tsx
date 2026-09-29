"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { subscribe, prefersReducedMotion } from "./parallaxTicker";
import { QUOTE_START, QUOTE_SPAN } from "./ScrollQuote";
import { LINE_SPAN_FACTOR } from "./ScrollLine";
import SplitText from "./SplitText";
import { INTRO_DURATION, INTRO_EASE } from "./intro";
import { useMagnetPull } from "./useMagnetPull";
import { useEntrance } from "./Entrance";

// A short hold (in viewport heights) after the line's draw target completes,
// before the circle starts, so the line's own eased draw visibly settles at its
// end first — the fill then clearly follows it rather than overlapping.
const START_DELAY = 0.12;
// The fill must finish before the page can't scroll any further. The footer is
// the last, full-height block, so at the very bottom its top sits at y=0; we
// complete the animation while its top is still this fraction of a viewport
// above that, leaving room for the eased tail to settle before the scroll
// bottoms out — so the fill is complete by the time the page ends.
const END_MARGIN = 0.28;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// The desktop mascot, a touch larger than its Figma frame (166×192) so it
// holds its own against the big "Let's talk?". (The mobile one follows its
// Figma frame, which already sizes it up — trimmed ~12% below Figma's 149px,
// as are "Let's talk?" (95→84) and the pills (105→92), to calm the footer.)
const MASCOT_SCALE = 1.2;

// On the "blur" entrance profile (the home) the circle's edge is soft: a feather
// this deep (in viewport heights) where the blue thins out into the page, on
// the same eased stops as the loader curtain's tail. Its alpha at each step
// through the feather, from the solid inside out to the edge:
const FEATHER = 0.2;
const FEATHER_STOPS = [
  [0, 1],
  [0.12, 0.91],
  [0.25, 0.74],
  [0.38, 0.54],
  [0.5, 0.35],
  [0.63, 0.19],
  [0.75, 0.08],
  [0.88, 0.02],
  [1, 0],
] as const;

/** A radial mask: solid out to `r - feather`, then eased down to clear at `r`. */
function softCircle(r: number, feather: number) {
  const inner = r - feather;
  const stops = FEATHER_STOPS.map(
    ([at, alpha]) => `rgb(0 0 0 / ${alpha}) ${(inner + at * feather).toFixed(1)}px`,
  ).join(", ");
  return `radial-gradient(circle ${Math.max(r, 0.1).toFixed(1)}px at 50% 0%, ${stops})`;
}

// The site's 4-column background grid (same values as DesktopCanvas): so the
// footer continues that grid behind it, and the blue circle floods in over the
// grid instead of over blank canvas.
const FRAME = 1440;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;
const COLUMNS = [20, 375, 730, 1085];
const COLUMN_WIDTH = 335;

// Mobile scale (360px design frame) + its 4-column grid, mirroring MobileCanvas,
// so the footer continues the same grid on phones.
const FRAME_M = 360;
const um = (px: number) => `${((px * 100) / FRAME_M).toFixed(4)}cqw`;
const COLUMNS_M = [10, 97.5, 185, 272.5];
const COLUMN_WIDTH_M = 77.5;

/**
 * The full-bleed blue footer, revealed as a circle that swells out of the point
 * where the hand-drawn line ends (its top-centre) and floods the whole space.
 * It starts only once the line has finished drawing and finishes before the page
 * bottoms out — both anchored to the live quote/line/footer geometry, so it
 * holds at any viewport size. On pages without the line (the case pages) the
 * circle is driven by the footer itself instead: it starts as the footer's top
 * enters the screen. Same on the desktop and mobile canvases, each chaining to
 * its own Linha line. Falls back to a plain blue block under reduced motion.
 *
 * Behind the blue lives the site's 4-column grid on canvas, so before the circle
 * appears the footer reads as a continuation of the grid, and the circle grows
 * over it.
 */
export default function FooterReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const soft = useEntrance() === "blur";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Hard-edged circle by default; a soft (masked) one on the blur profile.
    const reveal = (r: number | "full", vh: number) => {
      if (!soft) {
        el.style.clipPath = r === "full" ? "none" : `circle(${r.toFixed(1)}px at 50% 0%)`;
        return;
      }
      if (r === "full") {
        el.style.maskImage = "none";
        el.style.webkitMaskImage = "none";
        return;
      }
      // The feather grows in with the circle (all feather while it's small),
      // and the radius runs a feather past the corners so it ends solid.
      const feather = Math.min(FEATHER * vh, r);
      const mask = softCircle(r, feather);
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
    };

    // On both canvases (each Linha section has its own quote and line; only
    // the one on screen counts). Under reduced motion the footer just shows.
    if (prefersReducedMotion()) {
      reveal("full", 0);
      return;
    }

    // Start hidden; the first tick sets the real radius.
    reveal(0, window.innerHeight);

    let cur = 0;
    return subscribe(() => {
      // The visible canvas's quote and line (the other canvas's are display:none).
      const visible = (sel: string) =>
        Array.from(document.querySelectorAll<HTMLElement>(sel)).find((n) => n.getClientRects().length > 0);
      const quote = visible("[data-scroll-quote]");
      const line = visible("[data-scroll-line]");

      const rect = el.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      // With the line: anchor the start to the exact moment it finishes,
      // converting that moment into the footer-top position it corresponds to
      // via the fixed layout gap between the quote and the footer
      // (scroll-independent). Without it: start as the footer's top edge comes
      // up over the bottom of the screen.
      let startTop = vh;
      if (quote && line) {
        const quoteTop = quote.getBoundingClientRect().top;
        const gap = rect.top - quoteTop; // footer-top minus quote-top: constant
        const span = line.getBoundingClientRect().height * LINE_SPAN_FACTOR;
        const footerTopAtLineDone =
          QUOTE_START * vh - QUOTE_SPAN * vh - span + gap;
        startTop = footerTopAtLineDone - START_DELAY * vh;
      }

      // Progress runs from the start to a little before the bottom, both
      // expressed as footer-top positions, so it always completes in time.
      const endTop = END_MARGIN * vh;
      const denom = startTop - endTop;
      let target =
        denom > 0 ? clamp01((startTop - rect.top) / denom) : rect.top <= endTop ? 1 : 0;
      // The line eases after the scroll, so on a quick scroll it can still be
      // drawing when the scroll reaches its "done" point: hold the circle
      // until the line has really finished, then let it ease up to the scroll.
      const lineDrawn = line ? parseFloat(line.dataset.drawn ?? "1") : 1;
      if (lineDrawn < 0.999) target = 0;

      // Gentle smoothing on top of the scrub — gentler still while it has a
      // long way to catch up (after waiting for the line), so the circle
      // blooms out instead of popping to a large size in a frame.
      cur += (target - cur) * (target - cur > 0.15 ? 0.07 : 0.18);
      if (Math.abs(target - cur) < 0.0015) cur = target;

      // Reach every corner from the top-centre origin (+5% headroom, plus
      // the feather on the soft circle so its edge clears the corners).
      const maxR = Math.hypot(W / 2, H) * 1.05 + (soft ? FEATHER * vh : 0);
      reveal(cur >= 0.999 ? "full" : cur * maxR, vh);
    });
  }, [soft]);

  return (
    <footer
      data-cursor-dark
      className="relative w-full overflow-hidden bg-canvas"
      style={{ height: "100dvh", containerType: "inline-size" }}
    >
      {/* Background grid: the site's 4 columns, continued behind the footer so
          the blue circle floods in over the grid rather than blank canvas.
          Desktop columns on wide screens, the mobile grid on phones. */}
      {COLUMNS.map((left) => (
        <span
          key={left}
          aria-hidden
          className="absolute top-0 bottom-0 hidden border-x border-line landscape-tablet:block"
          style={{ left: u(left), width: u(COLUMN_WIDTH) }}
        />
      ))}
      {COLUMNS_M.map((left) => (
        <span
          key={`m-${left}`}
          aria-hidden
          className="absolute top-0 bottom-0 border-x border-line landscape-tablet:hidden"
          style={{ left: um(left), width: um(COLUMN_WIDTH_M) }}
        />
      ))}

      {/* Blue fill, clipped to the growing circle (desktop). The footer content
          lives inside it so it's revealed together with the flood. */}
      <div ref={ref} className="absolute inset-0 bg-ink">
        {/* Desktop layout */}
        <div className="hidden h-full landscape-tablet:block">
          {/* Mascot pinned to the top of the section (as in Figma), its eyes
              tracking the cursor. */}
          <MascotFace
            className="absolute"
            style={{ left: u(41), top: u(40), width: u(166.323 * MASCOT_SCALE), height: u(191.633 * MASCOT_SCALE) }}
          />
          <FooterContent />
        </div>
        {/* Mobile layout */}
        <div className="h-full landscape-tablet:hidden">
          <MobileFooterContent />
        </div>
      </div>
    </footer>
  );
}

// Text/icon colour from the Figma footer (node 75:2) — a lighter off-white than
// the page canvas, so it reads cleanly on the blue.
const FG = "#e0e0e0";

/**
 * The footer contents, reproducing the Figma frame (node 75:2, 1440×768):
 * "Let's talk?" and the two contact pills, a full-width divider, then the ©2026
 * line and social row. Laid out as that 768-tall frame, pinned to the bottom of
 * the full-height blue so the bottom row always sits at the page's end, and
 * scaled in `cqw` like the rest of the canvas. (The mascot is anchored to the
 * top of the section separately.)
 */
// Entrance timings (seconds), staggered so the footer "builds" as it's
// revealed: heading first, then the pills, the divider, and finally the bottom
// row, all on the site's entrance rhythm (the --dur-enter / --ease-enter
// tokens). Each piece stays hidden until the footer is in view, then plays its
// move as a keyframe animation — `.fade-up` (a short rise with a fade) or
// `.draw` for the divider — rather than a transition, so an entrance profile
// (the home's) can swap the move in CSS like everywhere else.
type Entrance = { className: string; style: CSSProperties };

function entrance(inView: boolean, reduced: boolean) {
  return (delay: number, move: "fade-up" | "draw" = "fade-up"): Entrance => {
    if (reduced) return { className: "", style: {} };
    if (!inView) return { className: "opacity-0", style: {} };
    return {
      className: move,
      style: { animationDelay: `${delay}s`, animationDuration: INTRO_DURATION, animationTimingFunction: INTRO_EASE },
    };
  };
}

function FooterContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  // Play the entrance once the footer is comfortably on screen (it's revealed by
  // the circle as you scroll to it). Under reduced motion, show it straight away
  // with no animation.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      // Defer to the next frame so it isn't a synchronous setState in the effect
      // body; shows the footer with no animation.
      const id = requestAnimationFrame(() => {
        setReduced(true);
        setInView(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const footer = el.closest("footer") ?? el;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // The non-text pieces' entrances (none under reduced motion).
  const enter = entrance(inView, reduced);
  const divider = enter(0.55, "draw");
  const socials = enter(0.7);

  return (
    <div ref={rootRef} className="absolute inset-x-0 bottom-0" style={{ height: u(768) }}>
      {/* "Let's talk?" + contact pills — one row, vertically centred so the
          title and the pills line up. The title uses `text-box-trim` so its box
          hugs the cap height (no half-leading space above/below the glyphs),
          matching Figma's "Vertical trim" option. */}
      <div
        className="absolute flex items-center justify-between"
        style={{ left: u(40), right: u(40), top: u(463), height: u(145) }}
      >
        <p
          className="whitespace-nowrap font-serif [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
          style={{ fontSize: u(190), lineHeight: 1, color: FG }}
        >
          {/* Word-by-word rise, like the hero H1. Mounted on reveal so it plays
              when the footer scrolls in. */}
          {inView && (
            <SplitText text="Let's talk?" stagger={0.09} startDelay={0.05} />
          )}
        </p>

        <div
          className="flex items-center"
          style={{ width: u(670), height: u(145), gap: u(20) }}
        >
          <ContactPill href="#" label="E-mail" enter={enter(0.32)}>
            <EmailIcon style={{ width: u(38.005), height: u(38.005) }} />
          </ContactPill>
          <ContactPill href="#" label="WhatsApp" enter={enter(0.42)}>
            <WhatsAppIcon style={{ width: u(33.933), height: u(33.933) }} />
          </ContactPill>
        </div>
      </div>

      {/* Divider (Vector 1) — full-width hairline, drawn in from the left. */}
      <div
        aria-hidden
        className={`absolute left-0 right-0 ${divider.className}`}
        style={{ top: u(668), height: "1px", backgroundColor: FG, ...divider.style }}
      />

      {/* ©2026 */}
      <p
        className="absolute font-mono whitespace-nowrap"
        style={{ left: u(40), top: u(705), fontSize: u(18), lineHeight: 1.4, color: FG }}
      >
        {inView && <SplitText text="©2026" stagger={0.07} startDelay={0.7} />}
      </p>

      {/* Social row (Frame 427319153) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/footer-socials.svg"
        alt="Social media"
        className={`absolute block ${socials.className}`}
        style={{
          right: u(40),
          top: u(708),
          width: u(197.338),
          height: u(20),
          ...socials.style,
        }}
      />
    </div>
  );
}

/**
 * Mobile footer: the same pieces stacked for a phone (360px frame). The mascot
 * sits at the top, and "Let's talk?", the two full-width pills, the divider and
 * the ©2026 / social row are grouped at the bottom. Same entrance choreography
 * as the desktop version.
 */
function MobileFooterContent() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      const id = requestAnimationFrame(() => {
        setReduced(true);
        setInView(true);
      });
      return () => cancelAnimationFrame(id);
    }
    const footer = el.closest("footer") ?? el;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const enter = entrance(inView, reduced);
  const mascot = enter(0.05);
  const pills = enter(0.28);
  const divider = enter(0.5, "draw");
  const bottomRow = enter(0.6);

  return (
    <div
      ref={rootRef}
      className="flex h-full flex-col justify-between"
      style={{ paddingInline: um(20), paddingTop: um(30), paddingBottom: um(26) }}
    >
      {/* Mascot at the top */}
      <MascotFace
        followScroll
        className={`relative shrink-0 ${mascot.className}`}
        style={{ width: um(131), height: um(150.93), ...mascot.style }}
      />

      {/* Bottom stack (Figma 1:169): "Let's talk?" with the pills 16px under
          it, then the divider + ©2026 row 26px below */}
      <div className="flex flex-col" style={{ gap: um(26) }}>
        <div className="flex flex-col" style={{ gap: um(16) }}>
          <h2 className="whitespace-nowrap font-serif" style={{ fontSize: um(84), lineHeight: 1, color: FG }}>
            {inView && (
              <SplitText text="Let's talk?" stagger={0.09} startDelay={0.05} />
            )}
          </h2>

          <div className={`flex flex-col ${pills.className}`} style={{ gap: um(12), ...pills.style }}>
            <MobilePill href="#" label="WhatsApp">
              <WhatsAppIcon style={{ width: um(21.4), height: um(21.4) }} />
            </MobilePill>
            <MobilePill href="#" label="E-mail">
              <EmailIcon style={{ width: um(24), height: um(24) }} />
            </MobilePill>
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: um(16) }}>
          {/* Full-bleed: pulled out past the content's side padding so it runs
              edge to edge of the screen. */}
          <div
            aria-hidden
            className={divider.className}
            style={{ height: "1px", marginInline: `calc(-1 * ${um(20)})`, backgroundColor: FG, ...divider.style }}
          />
          <div className="flex items-center justify-between">
            <p
              className={`font-mono whitespace-nowrap ${bottomRow.className}`}
              style={{ fontSize: um(14), lineHeight: 1.4, color: FG, ...bottomRow.style }}
            >
              ©2026
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/figma/footer-socials.svg"
              alt="Social media"
              className={`block ${bottomRow.className}`}
              style={{ width: um(150), height: um(15.2), ...bottomRow.style }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobilePill({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="footer-pill flex items-center justify-center rounded-full border font-serif"
      style={{ height: um(92), gap: um(12) }}
    >
      <span className="whitespace-nowrap" style={{ fontSize: um(32), lineHeight: 1 }}>
        {label}
      </span>
      {children}
    </a>
  );
}

function ContactPill({
  href,
  label,
  children,
  enter,
}: {
  href: string;
  label: string;
  children: ReactNode;
  enter: Entrance;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  useMagnetPull(ref, contentRef);

  return (
    // `footer-pill` (globals.css) does the hover/cursor-magnet colour swap; the
    // icon uses currentColor so text + icon flip to blue together. `data-cursor-
    // magnet` makes the trailing dot magnet into it, like the menu button.
    <a
      ref={ref}
      href={href}
      data-cursor-magnet
      // The whole pill (border + icon + label) enters on reveal; its hover
      // colour fade comes from `.footer-pill`.
      className={`footer-pill flex h-full flex-1 items-center justify-center rounded-full border font-serif will-change-transform ${enter.className}`}
      style={{ paddingLeft: u(10), paddingBlock: u(36), ...enter.style }}
    >
      {/* Label and icon are pulled separately (useMagnetPull), by how close the cursor is to each. */}
      <span ref={contentRef} className="flex items-center" style={{ gap: u(20) }}>
        <span className="whitespace-nowrap" style={{ fontSize: u(42), lineHeight: 1 }}>
          {label}
        </span>
        {children}
      </span>
    </a>
  );
}

// Icons inlined (not <img>) so they inherit the pill's colour via currentColor
// and flip to blue on hover. Boxes keep the exact Figma dimensions.
function EmailIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 38.0049 38.0049"
      fill="none"
      aria-hidden
      className="block shrink-0"
      style={style}
    >
      <path
        d="M34.8387 11.0845L20.6011 20.1534C20.118 20.434 19.5692 20.5818 19.0105 20.5818C18.4517 20.5818 17.9029 20.434 17.4198 20.1534L3.16797 11.0845"
        stroke="currentColor"
        strokeWidth="2.91667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31.6716 6.33398H6.33504C4.58592 6.33398 3.16797 7.75193 3.16797 9.50106V28.5035C3.16797 30.2526 4.58592 31.6706 6.33504 31.6706H31.6716C33.4208 31.6706 34.8387 30.2526 34.8387 28.5035V9.50106C34.8387 7.75193 33.4208 6.33398 31.6716 6.33398Z"
        stroke="currentColor"
        strokeWidth="2.91667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon({ style }: { style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 33.9329 33.9329"
      fill="none"
      aria-hidden
      className="block shrink-0"
      style={style}
    >
      <path
        d="M28.8506 4.93088C25.6769 1.74967 21.4505 0 16.9589 0C7.68793 0 0.143912 7.54402 0.143912 16.815C0.143912 19.7765 0.916492 22.6699 2.38591 25.2225L0 33.9329L8.91497 31.5925C11.369 32.9331 14.1337 33.6375 16.9513 33.6375H16.9589C26.2223 33.6375 33.9329 26.0935 33.9329 16.8226C33.9329 12.331 32.0242 8.11209 28.8506 4.93088ZM16.9589 30.8047C14.4442 30.8047 11.9826 30.1306 9.83903 28.8581L9.33155 28.5552L4.04468 29.9413L5.45351 24.7832L5.12024 24.253C3.71899 22.0261 2.98428 19.4584 2.98428 16.815C2.98428 9.1119 9.25581 2.84037 16.9665 2.84037C20.7006 2.84037 24.2075 4.29464 26.8434 6.93807C29.4792 9.58151 31.1001 13.0884 31.0926 16.8226C31.0926 24.5332 24.662 30.8047 16.9589 30.8047ZM24.6241 20.337C24.2075 20.125 22.1397 19.11 21.7534 18.9737C21.3671 18.8297 21.0869 18.7616 20.8066 19.1857C20.5264 19.6099 19.7235 20.5491 19.4736 20.8369C19.2312 21.1172 18.9812 21.1551 18.5646 20.943C16.0954 19.7084 14.4745 18.7389 12.846 15.9439C12.4143 15.2016 13.2778 15.2547 14.0806 13.6489C14.217 13.3687 14.1488 13.1263 14.0428 12.9142C13.9367 12.7021 13.096 10.6343 12.7476 9.79359C12.4067 8.97556 12.0583 9.08918 11.8008 9.07403C11.5584 9.05888 11.2782 9.05888 10.9979 9.05888C10.7177 9.05888 10.2632 9.16492 9.87691 9.58151C9.49062 10.0057 8.40749 11.0206 8.40749 13.0884C8.40749 15.1562 9.91478 17.1558 10.1193 17.4361C10.3314 17.7163 13.0808 21.9579 17.2997 23.7833C19.9659 24.9346 21.0111 25.0331 22.3442 24.8362C23.1547 24.715 24.8286 23.8212 25.177 22.8366C25.5254 21.8519 25.5254 21.0111 25.4194 20.8369C25.3209 20.6476 25.0407 20.5415 24.6241 20.337Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Eye geometry in the SVG's own viewBox units (0..166.323 × 0..191.633). Each
// pupil (a blue disc, r≈7) tracks the cursor across its own eye-white. The values
// were measured from the artwork by scanning where the whole pupil still sits on
// the white: `cx/cy` is the white's centre, `rx/ry` the ellipse the pupil CENTRE
// may roam (white radius minus pupil radius), and `rest` the Figma resting spot
// it returns to with no pointer. Per-eye (not a shared vector) so each uses its
// full range — which is why the vertical travel can be generous — while both
// still point at the same cursor, so they never look cross-eyed.
const VIEWBOX_W = 166.323;
const EYES = [
  { rest: [50, 76], cx: 39.5, cy: 71.3, rx: 10.5, ry: 13.3 }, // left eye
  { rest: [98, 89], cx: 90.3, cy: 84.3, rx: 14.3, ry: 14.3 }, // right eye
] as const;
// Cursor distance (viewBox units) at which a pupil reaches its eye-white edge.
// Small, because the cursor is almost always well outside the little mascot, so
// the pupils ride near the edge toward it — the full range the references show.
const GAZE_REACH = 78;

/**
 * The mascot with pupils that follow the cursor. The face is the pupil-less SVG;
 * two blue pupils are overlaid in a matching viewBox and nudged toward the
 * pointer, clamped so they stay within the eye whites. Both pupils shift by the
 * same vector (the eyes converge on one point), and everything eases via the
 * shared ticker. Under reduced motion the pupils stay at their designed rest
 * position, so the face reads exactly like the Figma frame.
 */
// Scroll-driven gaze (phones): how far away the virtual point the eyes look at
// is placed, in px — far enough that the pupils ride their eye-white edges.
const GAZE_FAR = 2000;

function MascotFace({
  className,
  style,
  followScroll = false,
}: {
  className?: string;
  style?: CSSProperties;
  /** Phones, where there's no pointer to follow: the eyes follow the scroll
   *  instead — looking up as the footer comes in, turning round to look down
   *  at the contact pills by the end of the page. */
  followScroll?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<SVGCircleElement>(null);
  const rightRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const pupilEls = [leftRef.current, rightRef.current];
    if (!root || !pupilEls[0] || !pupilEls[1] || prefersReducedMotion()) return;

    let mouseX = 0;
    let mouseY = 0;
    let tracking = false;
    // Current eased translate per pupil.
    const cur = EYES.map(() => ({ x: 0, y: 0 }));

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      tracking = true;
    };
    const onLeave = () => {
      tracking = false; // ease back to rest when the pointer leaves the page
    };
    // Touch: the eyes look toward the last place the person tapped and hold there
    // (no reset on touchend), since there's no hovering pointer on a phone.
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0] ?? e.changedTouches[0];
      if (!t) return;
      mouseX = t.clientX;
      mouseY = t.clientY;
      tracking = true;
    };
    if (!followScroll) {
      window.addEventListener("mousemove", onMove, { passive: true });
      document.addEventListener("mouseleave", onLeave);
      window.addEventListener("touchstart", onTouch, { passive: true });
      window.addEventListener("touchmove", onTouch, { passive: true });
    }

    // Scroll gaze: the footer's progress onto the screen (0 as its top enters
    // at the bottom, 1 once it fills the screen at the end of the page) turns
    // the look from straight up round to the first contact pill.
    const aimByScroll = (rect: DOMRect) => {
      const footer = root.closest("footer");
      if (!footer) return;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const p = clamp01(1 - footer.getBoundingClientRect().top / vh);
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const pill = Array.from(footer.querySelectorAll<HTMLElement>(".footer-pill")).find(
        (el) => el.getClientRects().length > 0,
      );
      const pr = pill?.getBoundingClientRect();
      const down = pr ? Math.atan2(pr.top + pr.height / 2 - cy, pr.left + pr.width / 2 - cx) : Math.PI / 2;
      const angle = -Math.PI / 2 + (down + Math.PI / 2) * p;
      mouseX = cx + Math.cos(angle) * GAZE_FAR;
      mouseY = cy + Math.sin(angle) * GAZE_FAR;
      tracking = true;
    };

    const unsubscribe = subscribe(() => {
      const rect = root.getBoundingClientRect();
      if (followScroll) aimByScroll(rect);
      const scale = rect.width > 0 ? rect.width / VIEWBOX_W : 0;
      const cvx = scale ? (mouseX - rect.left) / scale : 0;
      const cvy = scale ? (mouseY - rect.top) / scale : 0;

      EYES.forEach((eye, i) => {
        let targetX = 0;
        let targetY = 0;

        if (tracking && scale) {
          // Direction from the eye-white centre to the cursor.
          let ox = cvx - eye.cx;
          let oy = cvy - eye.cy;
          const dist = Math.hypot(ox, oy);
          if (dist > 0.001) {
            ox /= dist;
            oy /= dist;
            // Ellipse radius along this direction, times how far the cursor is
            // (saturating), gives the pupil-centre offset inside the white.
            const edge = 1 / Math.hypot(ox / eye.rx, oy / eye.ry);
            const reach = Math.min(1, dist / GAZE_REACH) * edge;
            // Translate is measured from the pupil's resting position.
            targetX = eye.cx + ox * reach - eye.rest[0];
            targetY = eye.cy + oy * reach - eye.rest[1];
          }
        }

        const c = cur[i];
        c.x += (targetX - c.x) * 0.12;
        c.y += (targetY - c.y) * 0.12;
        if (Math.abs(targetX - c.x) < 0.01 && Math.abs(targetY - c.y) < 0.01) {
          c.x = targetX;
          c.y = targetY;
        }
        pupilEls[i]?.setAttribute(
          "transform",
          `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)})`,
        );
      });
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      unsubscribe();
    };
  }, [followScroll]);

  return (
    <div ref={rootRef} className={className} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/footer-mascot-blank.svg"
        alt="Adriel Colaço"
        className="absolute inset-0 block h-full w-full"
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 166.323 191.633"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden
      >
        <circle ref={leftRef} cx="50" cy="76" r="7" fill="#001FFF" />
        <circle ref={rightRef} cx="98" cy="89" r="7" fill="#001FFF" />
      </svg>
    </div>
  );
}
