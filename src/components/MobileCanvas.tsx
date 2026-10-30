import type { ReactNode } from "react";
import Link from "next/link";
import ItalicI from "./ItalicI";
import Seals, { type Seal } from "./Seals";
import { ONPROFIT_SEALS, SHOW_SEE_ALL, WIP_LABEL, WIP_TAG_SCALE, isShown, isWip, tagStyle, tagsBoxStyle } from "./projects";
import ParallaxImage from "./ParallaxImage";
import HeroHeading from "./HeroHeading";
import HeroCTA from "./HeroCTA";
import { WHATSAPP_URL } from "./contact";
import ArrowIcon from "./ArrowIcon";
import LinhaSectionMobile from "./LinhaSectionMobile";
import { introStyle } from "./intro";
import Reveal from "./Reveal";

/**
 * The mobile home (portrait tablets + phones), on the 360px Figma mobile frame:
 * the hero, the project cards, "See all projects", Capabilities and the Linha
 * section. Everything is in `cqw` units so the layout scales proportionally
 * with the viewport while keeping the design intact — the mobile counterpart
 * of DesktopCanvas.
 *
 * Frame width = 360px -> 100cqw. So 1px = (100 / 360) cqw.
 */
const FRAME = 360;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

// 4-column grid: 10px outer margin, 77.5px columns, 10px gutters. Drawn as on
// desktop: single 1.5px strokes at the margins and down the middle of each
// gutter, the cards 10px inside them.
const GRID_LINES = [10, 92.5, 180, 267.5, 350];
const GRID_STROKE = 1.5;

// The hero fills the first screen, like desktop: the first card is pinned so
// its top PEEK px show at the bottom of the screen, "Recent work ↓" sits just
// above it, and the heading + CTA are centred in the space between the header
// and "Recent work". Everything below hangs off the same anchor. `svh` (the viewport with the browser's toolbars
// showing) keeps the peek visible behind a mobile browser's bottom bar.
const FIRST_CARD = 732; // y of the first card in the frame, in design px
const RECENT_WORK = 700; // y of the "Recent work ↓" row, 32px above it
const PEEK = 56;
const ANCHOR = `calc(100svh - ${u(PEEK)})`;
const y = (px: number) => {
  const cqw = ((px - FIRST_CARD) * 100) / FRAME;
  return `calc(${ANCHOR} ${cqw < 0 ? "-" : "+"} ${Math.abs(cqw).toFixed(4)}cqw)`;
};

// Below the cards: "See all projects" 40px under the last one, then 100px to
// Capabilities (which flows from there).
const SEE_ALL_TOP = 4216;
const SEE_ALL_HEIGHT = 52;

// Heading size: its widest line ("agencies worldwide", 6.75em) just fills the
// 320px content width, so the heading spans the container.
const HEADING_SIZE = 47;

type MCard = {
  name: string;
  image: string;
  tags: string[];
  /** Left/top of the card and its width, in design px. */
  x: number;
  y: number;
  w: number;
  /** Image height in design px (large = 328, small = 270). */
  imageHeight: number;
  objectPosition?: string;
  /** Its case page, when it has one: the whole card links there. */
  href?: string;
  /** Ribbons hung from the image's top-right corner. */
  seals?: Seal[];
};

// Same eight projects as desktop, in the Figma mobile order: full-width "large"
// cards alternating with smaller cards nudged left/right.
const ALL_CARDS: MCard[] = [
  { name: "TCL SEMP", image: "/projects/tcl-semp-cover-v4.webp", tags: ["UX/UI"], x: 20, y: 732, w: 320, imageHeight: 328, objectPosition: "center", href: "/cases/tcl-semp" },
  { name: "OnProfit", image: "/projects/onprofit.webp", tags: ["UX/UI", "3D", "Art Direction"], x: 102.5, y: 1204, w: 237.5, imageHeight: 270, objectPosition: "center", href: "/cases/onprofit", seals: ONPROFIT_SEALS },
  { name: "Remapp", image: "/projects/remapp-cover-v4.webp", tags: ["3D", "Illustration"], x: 20, y: 1618, w: 320, imageHeight: 328, objectPosition: "center", href: "/cases/remapp" },
  { name: "Holly Bakehouse", image: "/projects/holly-bakehouse-cover-v2.webp", tags: ["Illustration", "Logo Design"], x: 20, y: 2090, w: 237.5, imageHeight: 270, objectPosition: "center", href: "/cases/holly-bakehouse" },
  { name: "Hungara Lanches", image: "/projects/hungara.jpg", tags: ["UX/UI", "Illustration"], x: 20, y: 2504, w: 320, imageHeight: 328, objectPosition: "center" },
  { name: "Farol Santander", image: "/projects/farol.jpg", tags: ["UX/UI"], x: 102.5, y: 2976, w: 237.5, imageHeight: 270, objectPosition: "center bottom" },
  { name: "Trivium", image: "/projects/trivium.jpg", tags: ["UX/UI", "Illustration"], x: 20, y: 3390, w: 320, imageHeight: 328, objectPosition: "center top" },
  { name: "FTD Educação", image: "/projects/ftd.jpg", tags: ["UX/UI"], x: 20, y: 3862, w: 237.5, imageHeight: 270, objectPosition: "center" },
];

// Projects hidden for now (HIDDEN_PROJECTS) are left out, and Capabilities
// follows the last card still shown by the same 100px.
const CARDS = ALL_CARDS.filter(isShown);
const LAST_CARD_END = Math.max(...CARDS.map((card) => card.y + card.imageHeight)) + 12 + 32;
const CARDS_END = (SHOW_SEE_ALL ? SEE_ALL_TOP + SEE_ALL_HEIGHT : LAST_CARD_END) + 100;

/** A tag (square, as in the Figma); `wip` is the blue "Work in Progress" one. */
function Tag({ label, wip = false }: { label: string; wip?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center font-mono leading-none ${wip ? "bg-ink text-white" : "bg-white text-ink"}`}
      style={tagStyle(wip ? (px) => u(px * WIP_TAG_SCALE) : u, "mobile")}
    >
      {label}
    </span>
  );
}

/** The card's body: a link to its case page when it has one. */
function CardBody({ href, children }: { href?: string; children: ReactNode }) {
  const className = "flex flex-col";
  const style = { gap: u(12) };
  return href ? (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  ) : (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

function ProjectCard({ card, entrance }: { card: MCard; entrance: boolean }) {
  return (
    <div
      className={`absolute ${entrance ? "rise" : ""}`}
      style={{
        left: u(card.x),
        top: y(card.y),
        width: u(card.w),
        ...(entrance ? introStyle("cards") : {}),
      }}
    >
      <CardBody href={card.href}>
        <div className="group relative w-full overflow-hidden" style={{ height: u(card.imageHeight) }}>
          {/* Cards keep their static grid positions on mobile, but the image still
              drifts with the same scroll parallax as desktop. */}
          <ParallaxImage
            src={card.image}
            alt={card.name}
            frame={{ width: card.w, height: card.imageHeight, canvas: FRAME }}
            objectPosition={card.objectPosition ?? "center"}
            travel={card.imageHeight >= 300 ? 0.67 : 0.9}
            zoom={!isWip(card)}
          />
          {/* The seals drop in as the card scrolls into view (the frame-sized
              Reveal is what's observed; the ribbons move inside it). */}
          {card.seals && (
            <Reveal className="absolute inset-0">
              <Seals seals={card.seals} unit={u} width={24} textSize={11.4} enter={{ at: 0.1 }} />
            </Reveal>
          )}
          {/* Tags flow in rows, wrapping when they run out of width (Figma's
              "Tags container"). */}
          <div
            className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-start"
            style={tagsBoxStyle(u, "mobile")}
          >
            {isWip(card) ? <Tag label={WIP_LABEL} wip /> : card.tags.map((tag) => <Tag key={tag} label={tag} />)}
          </div>
        </div>
        <p className="font-serif leading-none text-ink" style={{ fontSize: u(32) }}>
          <ItalicI>{card.name}</ItalicI>
        </p>
      </CardBody>
    </div>
  );
}

export default function MobileCanvas() {
  return (
    <div className="w-full" style={{ containerType: "inline-size" }}>
      {/* Canvas: the absolute hero + cards area, then Capabilities in flow. The
          column strokes run the full height, down to the Linha section's top
          border, which caps them. */}
      <div className="relative w-full" style={{ paddingBottom: u(20) }}>
        {/* Background grid: one stroke per line, full height of the canvas */}
        {GRID_LINES.map((x) => (
          <span
            key={x}
            aria-hidden
            className="absolute top-0 bottom-0 bg-line"
            style={{ left: `calc(${u(x)} - ${GRID_STROKE / 2}px)`, width: `${GRID_STROKE}px` }}
          />
        ))}

        {/* Holds the height of the absolutely placed hero and cards. */}
        <div aria-hidden style={{ height: y(CARDS_END) }} />

        {/* Heading + CTA as one block, centred — across the page, as on
            desktop, and between the fixed header and "Recent work". Same copy
            and typed word as desktop. */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            left: u(20),
            width: u(320),
            top: "var(--header-bottom)",
            height: `calc(${y(RECENT_WORK)} - var(--header-bottom))`,
          }}
        >
          <HeroHeading className="text-center font-serif text-ink" style={{ fontSize: u(HEADING_SIZE), lineHeight: 0.95 }} />
          <div
            className="rise shrink-0"
            style={{ marginTop: u(24), width: u(220), height: u(52), ...introStyle("cta") }}
          >
            <HeroCTA label="Get in touch" href={WHATSAPP_URL} fontSize={u(24)} iconSize={u(22)} paddingLeft={u(22)} paddingRight={u(18)} />
          </div>
        </div>

        {/* "Recent work ↓" just above the first card (no free column on mobile) */}
        <div
          data-anchor="work"
          className="rise absolute flex items-center justify-between text-muted"
          style={{ left: u(20), top: y(RECENT_WORK), width: u(320), ...introStyle("recentWork") }}
        >
          <p
            className="whitespace-nowrap font-mono [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
            style={{ fontSize: u(13), lineHeight: 1.4 }}
          >
            Recent work
          </p>
          <ArrowIcon glyph="down" style={{ width: u(16), height: u(16) }} />
        </div>

        {/* Project cards — only the first one peeks above the fold at load, so
            only it joins the hero entrance. */}
        {CARDS.map((card, index) => (
          <ProjectCard key={card.name} card={card} entrance={index === 0} />
        ))}

        {/* "See all projects", full content width under the last card */}
        {SHOW_SEE_ALL && (
          <div
            className="absolute"
            style={{ left: u(20), top: y(SEE_ALL_TOP), width: u(320), height: u(SEE_ALL_HEIGHT) }}
          >
            <HeroCTA label="See all projects" icon="plus" fontSize={u(24)} iconSize={u(22)} paddingLeft={u(22)} paddingRight={u(18)} />
          </div>
        )}

      </div>

      <LinhaSectionMobile />
    </div>
  );
}
