import type { ReactNode } from "react";
import Link from "next/link";
import Seals, { type Seal } from "./Seals";
import { ONPROFIT_SEALS, SHOW_SEE_ALL, WIP_LABEL, WIP_TAG_SCALE, isShown, isWip, tagStyle, tagsBoxStyle } from "./projects";
import ItalicI from "./ItalicI";
import ParallaxImage from "./ParallaxImage";
import ParallaxCard from "./ParallaxCard";
import ProjectCursor from "./ProjectCursor";
import Capabilities from "./Capabilities";
import LinhaSection from "./LinhaSection";
import HeroHeading from "./HeroHeading";
import HeroCTA from "./HeroCTA";
import { WHATSAPP_URL } from "./contact";
import ArrowIcon from "./ArrowIcon";
import { introDelay, introStyle } from "./intro";

/**
 * Pixel-exact reproduction of the Figma frame (1440 wide × 6657 tall, node 31:6).
 * The content grid is 1400px wide, inset 20px on each side: 4 columns of 335px
 * with a 20px gap. Cards are positioned absolutely using the exact Figma
 * coordinates. Everything is expressed in `cqw` units so the whole canvas scales
 * proportionally with its container while keeping the design perfectly intact.
 *
 * Frame width = 1440px  ->  100cqw. So 1px = (100 / 1440) cqw.
 */
const FRAME = 1440;
const CANVAS_BOTTOM = 4569; // end of the absolute canvas, in design px: where the Linha section begins (everything below flows). Capabilities ends at 4545, 24px above it (Figma: 20).
const FIRST_ROW = 709; // y of the first card row, in design px (Figma node 31:19)

const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

// The hero fills the first screen, built up from its bottom edge: a hairline
// under "Recent work" sits 20px above the edge, "Recent work" sits 20px above
// the hairline, and the first card row starts level with "Recent work" (its cap
// height begins 6px below the row top). So only a sliver of cards peeks in, on
// any screen size. Rows below still scale with width (cqw), preserving the
// masonry.
const FOLD_GAP = 20; // hairline → bottom edge of the screen
const RECENT_GAP = 20; // "Recent work" baseline → hairline
const RECENT_INSET = 6; // first-row top → "Recent work" cap top
const RECENT_SIZE = 18; // "Recent work" font size
const RECENT_CAP = RECENT_SIZE * 0.71; // its height, trimmed to Geist Mono's cap height
const HAIRLINE_TOP = `calc(100vh - ${u(FOLD_GAP)} - 1px)`;
const ANCHOR = `calc(${HAIRLINE_TOP} - ${u(RECENT_GAP + RECENT_CAP + RECENT_INSET)})`;

// Top-anchored Y: the first row's anchor + width-scaled offset.
const y = (px: number) => {
  const cqw = ((px - FIRST_ROW) * 100) / FRAME;
  return `calc(${ANCHOR} ${cqw < 0 ? "-" : "+"} ${Math.abs(cqw).toFixed(4)}cqw)`;
};

// Column left edges in frame coordinates (20px outer margin + 335px cols + 20px gap)
const COL = { c1: 20, c2: 375, c3: 730, c4: 1085 } as const;

type Card = {
  name: string;
  image: string;
  tags: string[];
  left: number;
  top: number;
  width: number;
  imageHeight: number;
  objectPosition?: string;
  /** Parallax drift as a fraction of card height — larger cards move less. */
  speed: number;
  /** Its case page, when it has one: the whole card links there. */
  href?: string;
  /** Ribbons hung from the image's top-right corner. */
  seals?: Seal[];
};

// Each row pairs a large card with a small one aligned to its top; the small
// one drifts further down as the row scrolls through (see ParallaxCard).
const ALL_CARDS: Card[] = [
  { name: "TCL SEMP", image: "/projects/tcl-semp-cover-v2.webp", tags: ["UX/UI"], left: COL.c3, top: 709, width: 690, imageHeight: 620, speed: 0.04, href: "/cases/tcl-semp" },
  { name: "OnProfit", image: "/projects/onprofit.webp", tags: ["UX/UI", "3D", "Art Direction"], left: COL.c2, top: 709, width: 335, imageHeight: 448, speed: 0.14, href: "/cases/onprofit", seals: ONPROFIT_SEALS },
  { name: "Holly Bakehouse", image: "/projects/holly-bakehouse-cover-v2.webp", tags: ["Illustration", "Logo Design"], left: COL.c1, top: 1577, width: 690, imageHeight: 620, speed: 0.035, href: "/cases/holly-bakehouse" },
  { name: "Remapp", image: "/projects/remapp.jpg", tags: ["3D", "Illustration"], left: COL.c4, top: 1577, width: 335, imageHeight: 448, speed: 0.13, href: "/cases/remapp" },
  { name: "Hungara Lanches", image: "/projects/hungara.jpg", tags: ["UX/UI", "Illustration"], left: COL.c3, top: 2445, width: 690, imageHeight: 620, speed: 0.045 },
  { name: "Farol Santander", image: "/projects/farol.jpg", tags: ["UX/UI"], left: COL.c1, top: 2445, width: 335, imageHeight: 448, objectPosition: "center bottom", speed: 0.14 },
  { name: "Trivium", image: "/projects/trivium.jpg", tags: ["UX/UI", "Illustration"], left: COL.c1, top: 3313, width: 690, imageHeight: 620, objectPosition: "center top", speed: 0.04 },
  { name: "FTD Educação", image: "/projects/ftd.jpg", tags: ["UX/UI"], left: COL.c3, top: 3313, width: 335, imageHeight: 448, objectPosition: "center top", speed: 0.13 },
];

const CARDS = ALL_CARDS.filter(isShown);
// With rows hidden (HIDDEN_PROJECTS), everything under the cards — Capabilities
// and the canvas's end — moves up by the hidden rows' height.
const LAST_ROW = Math.max(...ALL_CARDS.map((card) => card.top));
const LIFT = LAST_ROW - Math.max(...CARDS.map((card) => card.top));

// Only the first row is on screen at load, so only it takes part in the hero
// entrance — left to right, like the rest of the cascade.
// The hero heading: 96px on the 1440 frame, scaling with the width — but no
// bigger than it would be on a 16:9 screen of the same height, so on
// ultra-wide screens (where the width outgrows the height) it stops growing
// instead of filling the two middle columns. 16:9 and taller: unchanged.
const HERO_SIZE = `min(${u(96)}, ${((96 / FRAME) * 100 * (16 / 9)).toFixed(4)}vh)`;

// How long after its card starts entering a card's seals drop in.
const SEALS_LAG = 0.4;
const FIRST_ROW_CARDS = CARDS.filter((card) => card.top === FIRST_ROW).sort((a, b) => a.left - b.left);

// The background grid is the 4 columns themselves, each a 335px-wide box with a
// stroke, running the full height of the canvas (Figma nodes 24:336–339).
const COLUMN_WIDTH = 335;

// "See all projects" (Figma 24:401) sits in the last column with its bottom
// level with the last row's large image — so it hangs off that card and rides
// its parallax, staying aligned however far the card has drifted.
const LAST_LARGE_CARD = CARDS.reduce((last, card) => (card.width > COLUMN_WIDTH && card.top >= last.top ? card : last));
const SEE_ALL = { left: COL.c4 + 20, width: 295, height: 56 };

/** A tag pill; `wip` is the blue "Work in Progress" one. */
function Tag({ label, wip = false }: { label: string; wip?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full font-mono leading-none ${wip ? "bg-ink text-white" : "bg-white text-ink"}`}
      style={tagStyle(wip ? (px) => u(px * WIP_TAG_SCALE) : u, "desktop")}
    >
      {label}
    </span>
  );
}

/** The card's link to its case page, when it has one. */
function CardLink({ href, children }: { href?: string; children: ReactNode }) {
  return href ? (
    <Link href={href} className="block">
      {children}
    </Link>
  ) : (
    children
  );
}

function ProjectCard({ card, children }: { card: Card; children?: ReactNode }) {
  const introStep = FIRST_ROW_CARDS.indexOf(card);
  return (
    <ParallaxCard className="absolute" style={{ left: u(card.left), top: y(card.top), width: u(card.width) }} speed={card.speed}>
      {/* Inner wrapper carries the load-in rise so it doesn't clash with the
          parallax transform on the ParallaxCard element. */}
      <div
        className={introStep >= 0 ? "rise" : undefined}
        style={introStep >= 0 ? introStyle("cards", introStep) : undefined}
      >
        <CardLink href={card.href}>
          <div className="group relative w-full overflow-hidden" data-project-card={isWip(card) ? undefined : ""} style={{ height: u(card.imageHeight) }}>
            {/* Taller (large) frames drift less so the image parallax feels
                consistent across card sizes instead of stronger on the big ones. */}
            <ParallaxImage
              src={card.image}
              alt={card.name}
              frame={{ width: card.width, height: card.imageHeight, canvas: FRAME }}
              objectPosition={card.objectPosition ?? "center"}
              travel={card.imageHeight >= 600 ? 0.05 : 0.08}
              blur={isWip(card) ? u(16) : undefined}
            />
            {/* A first-row card's seals drop in once the card is well on its way. */}
            {card.seals && (
              <Seals
                seals={card.seals}
                unit={u}
                width={28}
                textSize={13.7}
                enter={introStep >= 0 ? { at: introDelay("cards", introStep) + SEALS_LAG } : undefined}
              />
            )}
            {/* Tags flow in rows, wrapping when they run out of width (Figma's
                "Tags container"). */}
            <div
              className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-start"
              style={tagsBoxStyle(u, "desktop")}
            >
              {isWip(card) ? <Tag label={WIP_LABEL} wip /> : card.tags.map((tag) => <Tag key={tag} label={tag} />)}
            </div>
          </div>
          <p
            className="font-serif leading-none text-ink"
            style={{ marginTop: u(12), paddingInline: u(12), fontSize: u(36) }}
          >
            <ItalicI>{card.name}</ItalicI>
          </p>
        </CardLink>
      </div>
      {/* Anything hung off the card (positioned relative to it) drifts with it. */}
      {children}
    </ParallaxCard>
  );
}

export default function DesktopCanvas() {
  return (
    <div className="hidden w-full landscape-tablet:block portrait-tablet:hidden" style={{ containerType: "inline-size" }}>
      <ProjectCursor />
      <div className="relative w-full" style={{ height: `calc(${ANCHOR} + ${u(CANVAS_BOTTOM - LIFT - FIRST_ROW)})` }}>
        {/* Background grid: the 4 columns themselves, stroked full-height */}
        {Object.values(COL).map((left) => (
          <span
            key={left}
            aria-hidden
            // Vertical-only (border-x): a top/bottom border would double up
            // against the neighbouring section's hairline at the seam, reading
            // as a 2px line under each column. The columns are dividers, so the
            // Linha section's own top border caps them.
            className="absolute top-0 bottom-0 border-x border-line"
            style={{ left: u(left), width: u(COLUMN_WIDTH) }}
          />
        ))}

        {/* Heading + CTA as one block over columns 2–3, centred vertically in
            the space between the fixed header and the first card row. */}
        <div
          className="absolute flex flex-col justify-center"
          style={{
            left: u(395),
            width: u(650),
            top: "var(--header-bottom)",
            height: `calc(${ANCHOR} - var(--header-bottom))`,
          }}
        >
          <HeroHeading className="font-serif text-ink" style={{ fontSize: HERO_SIZE, lineHeight: 1 }} />

          {/* "Get in touch" CTA 40px under the heading (Figma 31:67), rising
              in after it. The wrapper carries the entrance so it never fights
              the link's own hover transitions. */}
          <div
            className="rise shrink-0"
            style={{ marginTop: u(40), width: u(295), height: u(56), ...introStyle("cta") }}
          >
            <HeroCTA label="Get in touch" href={WHATSAPP_URL} fontSize={u(28)} iconSize={u(24)} paddingLeft={u(24)} paddingRight={u(20)} />
          </div>
        </div>

        {/* "Recent work ↘" in the empty first column, level with the first card
            row (Figma 24:408 / 24:409). */}
        <div
          data-anchor="work"
          className="rise absolute flex items-start justify-between text-muted"
          style={{ left: u(40), top: y(FIRST_ROW), width: u(295), ...introStyle("recentWork") }}
        >
          <p
            className="whitespace-nowrap font-mono [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
            style={{ marginTop: u(RECENT_INSET), fontSize: u(RECENT_SIZE), lineHeight: 1.4 }}
          >
            Recent work
          </p>
          <ArrowIcon glyph="down-right" style={{ width: u(24), height: u(24) }} />
        </div>

        {/* Hairline closing "Recent work" across the first column, 20px above
            the bottom of the screen. Part of the grid, like the column strokes,
            so it's simply there as the curtain lifts (no entrance of its own). */}
        <span
          aria-hidden
          className="absolute bg-line"
          style={{ left: u(COL.c1), width: u(COLUMN_WIDTH), top: HAIRLINE_TOP, height: 1 }}
        />

        {/* Project cards; "See all projects" hangs off the last row's large card */}
        {CARDS.map((card) => (
          <ProjectCard key={card.name} card={card}>
            {SHOW_SEE_ALL && card === LAST_LARGE_CARD && (
              <div
                className="absolute"
                style={{
                  left: u(SEE_ALL.left - card.left),
                  top: u(card.imageHeight - SEE_ALL.height),
                  width: u(SEE_ALL.width),
                  height: u(SEE_ALL.height),
                }}
              >
                <HeroCTA label="See all projects" icon="plus" fontSize={u(28)} iconSize={u(24)} paddingLeft={u(24)} paddingRight={u(20)} />
              </div>
            )}
          </ProjectCard>
        ))}

        <Capabilities style={{ top: y(4181 - LIFT) }} />
      </div>

      {/* The Linha section flows below the canvas (the footer reveal chains off
          its hand-drawn line). */}
      <LinhaSection />
    </div>
  );
}
