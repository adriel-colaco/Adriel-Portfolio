"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion, subscribe } from "./parallaxTicker";

// The ring: the label three times around the circle, with a "•" between each.
// Every word and every bullet is placed on its own at an exact third of the
// circumference — words centred in their thirds, bullets on the boundaries — so
// the gaps come out identical all the way round, including where the loop
// closes (one long string laid on the circle would end with a different gap at
// its seam). Rendered uppercase via CSS.
const RING_LABEL = "Abrir case";
const RING_COUNT = 3;
const RING_R = 40; // in the 100×100 viewBox
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;
const RING_STEP = RING_CIRCUMFERENCE / RING_COUNT;
const RING_WORD_LENGTH = 62; // each label's length along the ring, in viewBox units
// The circle traced twice, so the last bullet (at a full turn) still sits on the path.
const RING_PATH = `M 50,50 m -${RING_R},0 ${`a ${RING_R},${RING_R} 0 1,1 ${2 * RING_R},0 a ${RING_R},${RING_R} 0 1,1 -${2 * RING_R},0 `.repeat(2)}`;
const SIZE = 132; // badge box, px

/** One badge (ring of text + ink disc + arrow). `back` is the colour-swapped
 *  copy that shows outside the card (blue letters/arrow on a light disc). */
function Badge({ back }: { back?: boolean }) {
  const id = back ? "project-cursor-ring-back" : "project-cursor-ring";
  return (
    <>
      <svg
        viewBox="0 0 100 100"
        className="cursor-ring absolute inset-0 h-full w-full"
      >
        <defs>
          <path id={id} d={RING_PATH} fill="none" />
        </defs>
        <g className="cursor-ring-spin">
          <text
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]"
            fill={back ? "#001fff" : "#D4D4D8"}
            textAnchor="middle"
          >
            {Array.from({ length: RING_COUNT }, (_, i) => (
              <textPath
                key={`word-${i}`}
                href={`#${id}`}
                startOffset={(i + 0.5) * RING_STEP}
                textLength={RING_WORD_LENGTH}
                lengthAdjust="spacing"
              >
                {RING_LABEL}
              </textPath>
            ))}
            {Array.from({ length: RING_COUNT }, (_, i) => (
              <textPath key={`dot-${i}`} href={`#${id}`} startOffset={(i + 1) * RING_STEP}>
                •
              </textPath>
            ))}
          </text>
        </g>
      </svg>

      <div
        className="cursor-disc flex h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{ backgroundColor: back ? "#ffffff" : "#001fff" }}
      >
        <svg viewBox="0 0 44 44" className="cursor-arrow h-[40px] w-[40px]">
          <path
            d="M27.9706 27.6568V16.3431H16.6569M27.9706 16.3431L16.6569 27.6568"
            stroke={back ? "#001fff" : "white"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    </>
  );
}

/**
 * A viewport-fixed custom cursor. By default it trails the pointer as a small
 * ink dot. Over a project card it expands into the "Abrir case" badge — except
 * over anything in the card marked `data-cursor-plain` (the seals, whose
 * tooltip the badge would cover), where it stays a dot.
 *
 * Two stacked copies make the badge look like it's clipped by the card edge:
 * the FRONT copy (ink disc, white arrow, grey ring) is clipped to the part of
 * the badge that overlaps the hovered card, and the BACK copy (colour-swapped —
 * blue letters/arrow) is clipped to everything OUTSIDE the card. Together they
 * read as one badge whose colours invert as it crosses the card's edge.
 */
export default function ProjectCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const frontEl = frontRef.current;
    const backEl = backRef.current;
    if (!el || !frontEl || !backEl) return;

    const reduce = prefersReducedMotion();
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-project-card]"),
    );
    const magnets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-cursor-magnet]"),
    );
    // Sections over which the trailing dot should read as white (e.g. the blue
    // footer) instead of its default ink blue.
    const darkZones = Array.from(
      document.querySelectorAll<HTMLElement>("[data-cursor-dark]"),
    );

    let px = 0;
    let py = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let shown = false;
    let magnet: HTMLElement | null = null;
    let hoverCard: HTMLElement | null = null;
    let plain = false; // over a [data-cursor-plain] part of the card
    const syncHover = () => el.classList.toggle("is-hovering", !!hoverCard && !plain);

    // Clip the front copy to the union of EVERY card the badge overlaps (not
    // just the pointed one, so a neighbouring card under the badge still gets
    // the front colours) and the back copy to the complement — all expressed in
    // the badge's own 132×132 box.
    const updateClips = () => {
      if (!hoverCard) {
        frontEl.style.clipPath = "none";
        backEl.style.clipPath = "inset(100%)"; // hidden until over a card
        return;
      }
      const bx = x - SIZE / 2;
      const by = y - SIZE / 2;
      let rects = "";
      for (const c of cards) {
        const cr = c.getBoundingClientRect();
        const l = Math.max(0, Math.min(SIZE, cr.left - bx));
        const t = Math.max(0, Math.min(SIZE, cr.top - by));
        const r = Math.max(0, Math.min(SIZE, cr.right - bx));
        const b = Math.max(0, Math.min(SIZE, cr.bottom - by));
        if (r > l && b > t) rects += `M${l} ${t}H${r}V${b}H${l}Z`;
      }
      if (!rects) {
        // Badge sits entirely off every card → it's all "outside", so show the
        // white/blue back copy, not the ink front.
        frontEl.style.clipPath = "inset(100%)";
        backEl.style.clipPath = "none";
        return;
      }
      // Inside any card → front copy (union of the card rects).
      frontEl.style.clipPath = `path("${rects}")`;
      // Outside every card → back copy (box minus the card rects, even-odd).
      backEl.style.clipPath = `path(evenodd, "M0 0H${SIZE}V${SIZE}H0Z ${rects}")`;
    };

    const render = () => {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      updateClips();
    };
    const loop = () => {
      const k = reduce ? 1 : 0.15;
      let tx = px;
      let ty = py;
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        tx = r.left + r.width / 2;
        ty = r.top + r.height / 2;
      }
      x += (tx - x) * k;
      y += (ty - y) * k;
      render();
      raf =
        Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3
          ? requestAnimationFrame(loop)
          : 0;
    };
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const MAGNET_PAD = 8;
    // Whether an element is actually on top at its own centre — not covered by
    // something above it, like the open menu over the page's CTAs.
    const isUncovered = (m: HTMLElement, r: DOMRect) => {
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!top && m.contains(top);
    };
    const updateMagnet = () => {
      let hit: HTMLElement | null = null;
      for (const m of magnets) {
        const r = m.getBoundingClientRect();
        if (
          px >= r.left - MAGNET_PAD &&
          px <= r.right + MAGNET_PAD &&
          py >= r.top - MAGNET_PAD &&
          py <= r.bottom + MAGNET_PAD &&
          isUncovered(m, r)
        ) {
          hit = m;
          break;
        }
      }
      if (hit !== magnet) {
        if (magnet) magnet.removeAttribute("data-magnet-active");
        magnet = hit;
        el.classList.toggle("is-magnet", !!magnet);
        if (magnet) magnet.setAttribute("data-magnet-active", "");
      }
    };

    // Dark only where a dark zone is what's actually under the pointer (not
    // under the open menu, say).
    const updateDark = () => {
      const top = document.elementFromPoint(px, py);
      el.classList.toggle("is-dark", !!top && darkZones.some((z) => z.contains(top)));
      const overPlain = !!top?.closest("[data-cursor-plain]");
      if (overPlain !== plain) {
        plain = overPlain;
        syncHover();
      }
    };

    const onMove = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!shown) {
        x = px;
        y = py;
        render();
        shown = true;
        el.classList.add("is-visible");
      }
      updateMagnet();
      updateDark();
      tick();
    };
    const onWindowLeave = () => {
      shown = false;
      el.classList.remove("is-visible");
    };
    const onEnterCard = (e: Event) => {
      hoverCard = e.currentTarget as HTMLElement;
      syncHover();
      updateClips();
    };
    const onLeaveCard = () => {
      hoverCard = null;
      syncHover();
      updateClips();
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onWindowLeave);
    cards.forEach((c) => {
      c.addEventListener("mouseenter", onEnterCard);
      c.addEventListener("mouseleave", onLeaveCard);
    });
    // The card moves under a still cursor while the page scrolls (parallax),
    // so keep the clip in sync with scroll too.
    const unsubscribe = subscribe(() => {
      if (hoverCard) updateClips();
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onWindowLeave);
      cards.forEach((c) => {
        c.removeEventListener("mouseenter", onEnterCard);
        c.removeEventListener("mouseleave", onLeaveCard);
      });
      unsubscribe();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="project-cursor pointer-events-none fixed left-0 top-0 z-[60] h-[132px] w-[132px] will-change-transform"
    >
      {/* Colour-swapped copy, shown outside the card (blue letters/arrow) */}
      <div ref={backRef} className="absolute inset-0" style={{ clipPath: "inset(100%)" }}>
        <div className="flex h-full w-full items-center justify-center">
          <Badge back />
        </div>
      </div>
      {/* Front copy, clipped to the card so it stays trapped inside it */}
      <div ref={frontRef} className="absolute inset-0">
        <div className="flex h-full w-full items-center justify-center">
          <Badge />
        </div>
      </div>
    </div>
  );
}
