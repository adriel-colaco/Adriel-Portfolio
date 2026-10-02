"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import Link from "next/link";
import Seals, { type Seal } from "./Seals";
import { ONPROFIT_SEALS, SHOW_SEE_ALL, WIP_LABEL, WIP_TAG_SCALE, isShown, isWip, tagStyle, tagsBoxStyle } from "./projects";
import ItalicI from "./ItalicI";
import ParallaxImage from "./ParallaxImage";
import ProjectCursor from "./ProjectCursor";
import HeroHeading from "./HeroHeading";
import HeroCTA from "./HeroCTA";
import ArrowIcon from "./ArrowIcon";
import ScrollQuote from "./ScrollQuote";
import ScrollLine, { DESKTOP_LINE } from "./ScrollLine";
import PortraitReveal from "./PortraitReveal";
import { CAPABILITIES_INTRO, ITEMS_AT, ITEM_STAGGER, LINE_AT, PILLARS, timing, useRevealOnView } from "./Capabilities";
import { introDelay, introStyle } from "./intro";

/**
 * The portrait-tablet home: the desktop canvas's pieces and motion, laid on
 * 2 columns instead of 4 — each tablet column is two desktop columns side by
 * side. No Figma frame: it's drawn on an 820px frame (the 11" iPad held
 * upright), so on that iPad 1 design px is 1 screen px and the desktop's type
 * sizes carry over as they are. Everything is in `cqw`, like the other
 * canvases, so bigger tablets scale it up.
 *
 * Frame width = 820px -> 100cqw. So 1px = (100 / 820) cqw.
 */
const FRAME = 820;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

// 2 columns of 380px, 20px margins and gutter.
const COL = { c1: 20, c2: 420 } as const;
const COL_W = 380;
const CONTENT_W = 780;

// Section title rows, as on desktop: a 24px row with the 18px mono label's cap
// height centred in it, a hairline 20px under the label, the content 20px
// under that.
const ROW = 24;
const LABEL_CAP = 18 * 0.71;
const HAIRLINE_GAP = 20 - (ROW - LABEL_CAP) / 2; // row bottom → hairline
const TITLE_BLOCK = ROW + HAIRLINE_GAP + 1 + 20; // row top → content top
const LABEL_CLASS =
  "whitespace-nowrap font-mono font-normal text-muted [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]";

// The hero doesn't fill the whole (tall) first screen, as it does on desktop:
// the first card row starts HERO px under the header, so the top of the work
// already shows in the first screen, the heading keeping most of it. On a short window it still leaves at
// least PEEK px of the cards in view.
const HERO = 800;
const PEEK = 160;
const ANCHOR = `min(calc(var(--header-bottom) + ${u(HERO)}), calc(100svh - ${u(PEEK)}))`;
const y = (px: number) => `calc(${ANCHOR} ${px < 0 ? "-" : "+"} ${u(Math.abs(px))})`;

// The heading: the desktop's 96px (its widest line then spans 648px of the 740
// inside the columns' padding).
const HEADING_SIZE = 96;

type Card = {
  name: string;
  image: string;
  tags: string[];
  left: number;
  /** Top of its row, in design px below the first row. */
  top: number;
  objectPosition?: string;
  href?: string;
  seals?: Seal[];
};

// A plain 2-column grid, in the desktop's reading order: every card the same
// size, rows aligned. The cards stay put (no drift, unlike the desktop's
// ParallaxCard); only their images drift inside their frames.
const IMAGE_H = 480;
const NAME_GAP = 12;
const NAME_SIZE = 32;
const ROW_PITCH = IMAGE_H + NAME_GAP + NAME_SIZE + 80;
const row = (r: number) => r * ROW_PITCH;
const ALL_CARDS: Card[] = [
  { name: "OnProfit", image: "/projects/onprofit.webp", tags: ["UX/UI", "3D", "Art Direction"], left: COL.c1, top: row(0), href: "/cases/onprofit", seals: ONPROFIT_SEALS },
  { name: "TCL SEMP", image: "/projects/tcl-semp-cover-v2.webp", tags: ["UX/UI"], left: COL.c2, top: row(0), href: "/cases/tcl-semp" },
  { name: "Holly Bakehouse", image: "/projects/holly-bakehouse-cover-v2.webp", tags: ["Illustration", "Logo Design"], left: COL.c1, top: row(1), href: "/cases/holly-bakehouse" },
  { name: "Remapp", image: "/projects/remapp.jpg", tags: ["3D", "Illustration"], left: COL.c2, top: row(1), href: "/cases/remapp" },
  { name: "Farol Santander", image: "/projects/farol.jpg", tags: ["UX/UI"], left: COL.c1, top: row(2), objectPosition: "center bottom" },
  { name: "Hungara Lanches", image: "/projects/hungara.jpg", tags: ["UX/UI", "Illustration"], left: COL.c2, top: row(2) },
  { name: "Trivium", image: "/projects/trivium.jpg", tags: ["UX/UI", "Illustration"], left: COL.c1, top: row(3), objectPosition: "center top" },
  { name: "FTD Educação", image: "/projects/ftd.jpg", tags: ["UX/UI"], left: COL.c2, top: row(3), objectPosition: "center top" },
];

// Projects hidden for now (HIDDEN_PROJECTS) are left out; the grid ends at the last row still shown.
const CARDS = ALL_CARDS.filter(isShown);
const LAST_ROW_TOP = Math.max(...CARDS.map((card) => card.top));

// Only the first row is on screen at load, so only it joins the hero entrance.
const SEALS_LAG = 0.4;
const FIRST_ROW_CARDS = CARDS.filter((card) => card.top === 0);

// "See all projects" under the grid, in the right-hand column (inset like the
// desktop's), 60px below the last row.
const SEE_ALL = { top: LAST_ROW_TOP + IMAGE_H + NAME_GAP + NAME_SIZE + 60, width: COL_W - 40, height: 56 };
const CARDS_END = SHOW_SEE_ALL ? SEE_ALL.top + SEE_ALL.height : LAST_ROW_TOP + IMAGE_H + NAME_GAP + NAME_SIZE;

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

function CardLink({ href, children }: { href?: string; children: ReactNode }) {
  return href ? (
    <Link href={href} className="block">
      {children}
    </Link>
  ) : (
    children
  );
}

function ProjectCard({ card }: { card: Card }) {
  const introStep = FIRST_ROW_CARDS.indexOf(card);
  return (
    <div className="absolute" style={{ left: u(card.left), top: y(card.top), width: u(COL_W) }}>
      <div
        className={introStep >= 0 ? "rise" : undefined}
        style={introStep >= 0 ? introStyle("cards", introStep) : undefined}
      >
        <CardLink href={card.href}>
          <div
            className="group relative w-full overflow-hidden"
            data-project-card={isWip(card) ? undefined : ""}
            style={{ height: u(IMAGE_H) }}
          >
            <ParallaxImage
              src={card.image}
              alt={card.name}
              frame={{ width: COL_W, height: IMAGE_H, canvas: FRAME }}
              objectPosition={card.objectPosition ?? "center"}
              travel={0.06}
              blur={isWip(card) ? u(12) : undefined}
            />
            {card.seals && (
              <Seals
                seals={card.seals}
                unit={u}
                width={28}
                textSize={13.7}
                enter={introStep >= 0 ? { at: introDelay("cards", introStep) + SEALS_LAG } : undefined}
              />
            )}
            <div
              className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-start"
              style={tagsBoxStyle(u, "desktop")}
            >
              {isWip(card) ? <Tag label={WIP_LABEL} wip /> : card.tags.map((tag) => <Tag key={tag} label={tag} />)}
            </div>
          </div>
          <p
            className="font-serif leading-none text-ink"
            style={{ marginTop: u(NAME_GAP), paddingInline: u(12), fontSize: u(NAME_SIZE) }}
          >
            <ItalicI>{card.name}</ItalicI>
          </p>
        </CardLink>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ capabilities */

// A title row + its hairline, entering like the desktop's (the row rises, the
// hairline draws in after it).
function TitleRow({ children, icon, delay }: { children: ReactNode; icon?: boolean; delay: number }) {
  return (
    <>
      <div
        className="rise flex items-center justify-between text-muted"
        style={{ height: u(ROW), paddingInline: u(20), fontSize: u(18), lineHeight: 1.4, ...timing(delay) }}
      >
        {children}
        {icon && <ArrowIcon glyph="down" style={{ width: u(24), height: u(24) }} />}
      </div>
      <div
        aria-hidden
        className="draw bg-line"
        style={{ marginTop: u(HAIRLINE_GAP), height: 1, ...timing(delay + LINE_AT) }}
      />
    </>
  );
}

// Capabilities as a 2×2 grid: the title and intro, then the three pillars.
// Each row of the grid enters on its own as it scrolls in; within a row the
// right cell follows the left, as the desktop's columns follow each other.
const CELL_STAGGER = 0.08;
const PILLAR_SIZE = 28;

function CapabilitiesRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useRevealOnView(ref);
  return (
    <div ref={ref} className="grid" style={{ gridTemplateColumns: `repeat(2, ${u(COL_W)})`, columnGap: u(20) }}>
      {children}
    </div>
  );
}

function Pillar({ pillar, cell }: { pillar: (typeof PILLARS)[number]; cell: number }) {
  const delay = cell * CELL_STAGGER;
  return (
    <div>
      <TitleRow delay={delay}>
        <h3 className={LABEL_CLASS}>{pillar.title}</h3>
      </TitleRow>
      <ul
        className="flex flex-col font-serif text-ink"
        style={{ marginTop: u(20), paddingLeft: u(20), gap: u(16), fontSize: u(PILLAR_SIZE), lineHeight: 1 }}
      >
        {pillar.items.map((item, i) => (
          <li key={item} className="rise" style={timing(delay + ITEMS_AT + i * ITEM_STAGGER)}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CapabilitiesTablet({ style }: { style?: CSSProperties }) {
  return (
    <section
      aria-labelledby="capabilities-title-tablet"
      className="relative flex flex-col"
      style={{ marginInline: u(20), gap: u(100), ...style }}
    >
      <CapabilitiesRow>
        <div>
          <TitleRow icon delay={0}>
            <h2 id="capabilities-title-tablet" className={LABEL_CLASS}>
              Capabilities
            </h2>
          </TitleRow>
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
        <Pillar pillar={PILLARS[0]} cell={1} />
      </CapabilitiesRow>
      <CapabilitiesRow>
        <Pillar pillar={PILLARS[1]} cell={0} />
        <Pillar pillar={PILLARS[2]} cell={1} />
      </CapabilitiesRow>
    </section>
  );
}

/* ------------------------------------------------------------------- linha */

// The desktop's Linha section on the 780px content width: the portrait, the
// quote on its three fixed lines, and the desktop line (at a heavier stroke,
// so drawn this much smaller it still reads as the desktop's 2px), ending on
// the section's bottom edge, where the footer's circle starts.
const QUOTE_SIZE = 64;
const QUOTE_TOP = 270;
const LINE_W = 600;
const LINE_H = (LINE_W * ((944 * 739) / 842)) / 944; // the desktop box's shape
const LINE_TOP = QUOTE_TOP + QUOTE_SIZE * 3;
const TABLET_LINE = { ...DESKTOP_LINE, strokeWidth: (2 * 946) / LINE_W };

function LinhaSectionTablet() {
  return (
    <div
      data-linha
      className="relative border border-line bg-canvas"
      style={{ width: u(CONTENT_W), height: u(LINE_TOP + LINE_H), marginInline: "auto" }}
    >
      <PortraitReveal
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
        style={{ top: u(120), width: u(120), height: u(120) }}
      />
      <ScrollQuote
        text={"I believe design is about\nturning complexity\ninto clarity"}
        className="absolute text-center font-serif"
        style={{ left: u(40), top: u(QUOTE_TOP), width: u(CONTENT_W - 80), fontSize: u(QUOTE_SIZE), lineHeight: 1 }}
      />
      <ScrollLine
        line={TABLET_LINE}
        className="line-enter absolute"
        style={{ left: u((CONTENT_W - LINE_W) / 2), top: u(LINE_TOP), width: u(LINE_W), height: u(LINE_H) }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ canvas */

export default function TabletCanvas() {
  return (
    <div className="hidden w-full portrait-tablet:block" style={{ containerType: "inline-size" }}>
      <ProjectCursor />
      <div className="relative w-full" style={{ paddingBottom: u(24) }}>
        {/* Background grid: the 2 columns, stroked full height down to the
            Linha section's top border (vertical-only, as on desktop). */}
        {Object.values(COL).map((left) => (
          <span
            key={left}
            aria-hidden
            className="absolute top-0 bottom-0 border-x border-line"
            style={{ left: u(left), width: u(COL_W) }}
          />
        ))}

        {/* Holds the height of the absolutely placed hero and cards. */}
        <div aria-hidden style={{ height: y(CARDS_END) }} />

        {/* Heading + CTA, centred between the header and "Recent work". The
            CTA spans the left column, inset like "See all projects". */}
        <div
          className="absolute flex flex-col justify-center"
          style={{
            left: u(40),
            width: u(CONTENT_W - 40),
            top: "var(--header-bottom)",
            height: `calc(${y(-TITLE_BLOCK)} - var(--header-bottom))`,
          }}
        >
          <HeroHeading className="font-serif text-ink" style={{ fontSize: u(HEADING_SIZE), lineHeight: 1 }} />
          <div
            className="rise shrink-0"
            style={{ marginTop: u(40), width: u(SEE_ALL.width), height: u(56), ...introStyle("cta") }}
          >
            <HeroCTA label="Get in touch" fontSize={u(28)} iconSize={u(24)} paddingLeft={u(24)} paddingRight={u(20)} />
          </div>
        </div>

        {/* "Recent work ↓" across both columns, its hairline under it, just
            above the first row. */}
        <div data-anchor="work" className="absolute" style={{ left: u(COL.c1), width: u(CONTENT_W), top: y(-TITLE_BLOCK) }}>
          <div
            className="rise flex items-center justify-between text-muted"
            style={{ height: u(ROW), paddingInline: u(20), ...introStyle("recentWork") }}
          >
            <p className={LABEL_CLASS} style={{ fontSize: u(18), lineHeight: 1.4 }}>
              Recent work
            </p>
            <ArrowIcon glyph="down" style={{ width: u(24), height: u(24) }} />
          </div>
          <span aria-hidden className="block bg-line" style={{ marginTop: u(HAIRLINE_GAP), height: 1 }} />
        </div>

        {CARDS.map((card) => (
          <ProjectCard key={card.name} card={card} />
        ))}

        {SHOW_SEE_ALL && (
          <div
            className="absolute"
            style={{ left: u(COL.c2 + 20), top: y(SEE_ALL.top), width: u(SEE_ALL.width), height: u(SEE_ALL.height) }}
          >
            <HeroCTA label="See all projects" icon="plus" fontSize={u(28)} iconSize={u(24)} paddingLeft={u(24)} paddingRight={u(20)} />
          </div>
        )}

        <CapabilitiesTablet style={{ marginTop: u(160) }} />
      </div>

      <LinhaSectionTablet />
    </div>
  );
}
