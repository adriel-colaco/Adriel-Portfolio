"use client";

import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useRef } from "react";
import ArrowIcon from "./ArrowIcon";
import { INTRO_DURATION, INTRO_EASE } from "./intro";
import { prefersReducedMotion } from "./parallaxTicker";

/**
 * "Capabilities" (Figma 31:81–31:94, 31:25–31:27): what I do, in three pillars
 * laid on the 4-column grid — the section title in the first column (with a ↘,
 * like "Recent work ↘"), one pillar per column after it. Each column is a 24px
 * title row with its mono label centred in it, a hairline 20px below the label,
 * then the list 20px below that. Positioned by the DesktopCanvas (which also
 * draws the column strokes); sizes are `cqw` on the 1440 frame.
 *
 * It enters once, as it scrolls into view, in the hero's motion language:
 * column by column, each title rises from behind its mask, its hairline draws
 * left to right, then the items rise one after another.
 */
const FRAME = 1440;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

export const PILLARS = [
  {
    title: "UX/UI",
    items: [
      "Interface Design",
      "Digital Products",
      "Websites & Landing Pages",
      "Wireframing & Prototyping",
      "Design Systems",
      "Motion & Micro-interactions",
      "Vibe coding",
    ],
  },
  {
    title: "Brands",
    items: [
      "Logo & Symbol Design",
      "Visual Identity Systems",
      "Rebranding",
      "Brand Guidelines",
      "Typography & Color",
      "Brand Applications",
      "Packaging",
    ],
  },
  {
    title: "Art Direction",
    items: [
      "Styleframes",
      "Key Visuals",
      "Social Media",
      "Illustration",
      "Characters & Mascots",
      "Icons & Pictograms",
      "3D & Renders",
    ],
  },
];

// The intro under the "Capabilities" title (Figma 1:386 on desktop, 1:115 on mobile).
export const CAPABILITIES_INTRO =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const ROW = 24; // title row height (the icon's box); the 18px label's cap height is centred in it
const LABEL_CAP = 18 * 0.71; // the label, trimmed to Geist Mono's cap height
const LABEL_CLASS =
  "whitespace-nowrap font-mono font-normal text-muted [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]";

// Entrance timing, in seconds from the moment the section comes into view.
const COLUMN_STAGGER = 0.08; // each column starts this much after the previous one
export const LINE_AT = 0.1; // the hairline draws this long after its title starts rising
export const ITEMS_AT = 0.25; // the first item follows this long after the title…
export const ITEM_STAGGER = 0.05; // …and each next one this much later
export const timing = (delay: number): CSSProperties => ({
  animationDelay: `${delay.toFixed(2)}s`,
  animationDuration: INTRO_DURATION,
  animationTimingFunction: INTRO_EASE,
});

/**
 * Holds an element's `.rise` / `.draw` children on their first frame (armed)
 * until it scrolls `rootMargin` into view, then lets them play once. Without
 * JS nothing is armed, so the entrance just plays at load.
 */
export function useRevealOnView(ref: RefObject<HTMLElement | null>, rootMargin = "0px 0px -20% 0px") {
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.dataset.reveal = "armed";
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.reveal = "shown";
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
}

function TitleRow({ children, icon, column }: { children: ReactNode; icon?: boolean; column: number }) {
  return (
    <div
      className="rise flex items-center justify-between text-muted"
      style={{ height: u(ROW), paddingInline: u(20), fontSize: u(18), lineHeight: 1.4, ...timing(column * COLUMN_STAGGER) }}
    >
      {children}
      {icon && <ArrowIcon glyph="down-right" style={{ width: u(24), height: u(24) }} />}
    </div>
  );
}

// 20px below the label's baseline, which sits (ROW - LABEL_CAP) / 2 above the row's bottom.
function Hairline({ column }: { column: number }) {
  return (
    <div
      aria-hidden
      className="draw bg-line"
      style={{ marginTop: u(20 - (ROW - LABEL_CAP) / 2), height: 1, ...timing(column * COLUMN_STAGGER + LINE_AT) }}
    />
  );
}

export default function Capabilities({ style }: { style?: CSSProperties }) {
  const ref = useRef<HTMLElement>(null);
  useRevealOnView(ref);

  return (
    <section
      ref={ref}
      aria-labelledby="capabilities-title"
      className="absolute grid"
      style={{
        left: u(20),
        width: u(1400),
        gridTemplateColumns: `repeat(4, ${u(335)})`,
        columnGap: u(20),
        ...style,
      }}
    >
      <div>
        <TitleRow icon column={0}>
          <h2 id="capabilities-title" className={LABEL_CLASS}>
            Capabilities
          </h2>
        </TitleRow>
        <Hairline column={0} />
        <p
          className="rise font-mono text-muted"
          style={{
            marginTop: u(20),
            paddingInline: u(20),
            fontSize: u(18),
            lineHeight: 1.4,
            letterSpacing: "-0.03em",
            ...timing(ITEMS_AT),
          }}
        >
          {CAPABILITIES_INTRO}
        </p>
      </div>

      {PILLARS.map((pillar, p) => {
        const column = p + 1;
        return (
          <div key={pillar.title}>
            <TitleRow column={column}>
              <h3 className={LABEL_CLASS}>{pillar.title}</h3>
            </TitleRow>
            <Hairline column={column} />
            <ul
              className="flex flex-col font-serif text-ink"
              style={{ marginTop: u(20), paddingLeft: u(20), gap: u(16), fontSize: u(30), lineHeight: 1 }}
            >
              {pillar.items.map((item, i) => (
                <li key={item} className="rise" style={timing(column * COLUMN_STAGGER + ITEMS_AT + i * ITEM_STAGGER)}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
