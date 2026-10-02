import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import ArrowIcon from "./ArrowIcon";
import HeroCTA from "./HeroCTA";
import ItalicI from "./ItalicI";
import ParallaxImage from "./ParallaxImage";
import ProjectCursor from "./ProjectCursor";
import Reveal from "./Reveal";
import Seals from "./Seals";
import { CASES, type Case, type CaseBlock } from "./cases";
import { Curtain, CURTAIN_DROP, CURTAIN_LEAD, curtainPieceAt, curtainReach } from "./Curtain";
import { INTRO_DURATION, INTRO_EASE } from "./intro";
import { projectByName, tagStyle, tagsBoxStyle, type Project, type TagsVariant } from "./projects";

/**
 * A case page (Figma "Case", 2:75), like the home in two canvases: the 1440px
 * desktop frame (landscape tablets + desktop) and a 360px mobile frame
 * (portrait tablets + phones), each in `cqw` so the layout scales with the
 * viewport. Top to bottom: the intro — title + summary on the left, the facts
 * table on the right — the rows of image blocks, then "More works". The page's
 * FooterReveal follows.
 *
 * At load the intro's boxes are already in place and only their texts rise in,
 * then the first image unveils top to bottom like a curtain; the rest of the
 * blocks are simply there. "More works" rises in as it scrolls into view.
 */

const scale = (frame: number) => (px: number) => `${((px * 100) / frame).toFixed(4)}cqw`;
const u = scale(1440);
const um = scale(360);
const ut = scale(820);

// Entrance timing (seconds), in the hero's motion language.
const timing = (delay: number): CSSProperties => ({
  animationDelay: `${delay.toFixed(2)}s`,
  animationDuration: INTRO_DURATION,
  animationTimingFunction: INTRO_EASE,
});
const STAGGER = 0.08;
// The intro's entrance is one gesture travelling down the page: the header
// drops in, and the intro opens as one curtain (<Curtain>: both desktop boxes
// together, the whole stack on mobile) — every piece inside, the seals, the
// title, the summary, each facts row, appears as its edge reaches it. The first
// image then carries the wipe on down, opening as the intro's curtain lands.
// (A facts row isn't masked: a mask as short as a row would cut its blurred
// texts off mid-move.)
const LINE_AT = 0.1; // the top hairline fades in as the header drops…
const BOX_AT = LINE_AT + CURTAIN_LEAD; // …and the curtain sets off from it
const DROP = CURTAIN_DROP;
const reach = (p: number) => BOX_AT + curtainReach(p);
const pieceAt = (p: number) => curtainPieceAt(BOX_AT, p);

// Where each piece sits in the curtain, as a fraction of its height (for `n`
// facts rows): desktop's 410px boxes, the rows (60px each) stacked on the
// facts box's foot; mobile's stack, the title box over the rows (48px each).
// The title and summary tops are measured on the design (design px); their
// spots shift a little with the texts' length, which the blur-in absorbs.
type IntroLayout = { height: (n: number) => number; title: number; summary: number; rowHeight: number };
const INTRO_DESKTOP: IntroLayout = { height: () => 410, title: 213, summary: 288, rowHeight: 60 };
const INTRO_MOBILE: IntroLayout = { height: (n) => TITLE_BOX_M + n * 48, title: 123, summary: 186, rowHeight: 48 };
const introAt = (layout: IntroLayout, n: number) => ({
  title: pieceAt(layout.title / layout.height(n)),
  summary: pieceAt(layout.summary / layout.height(n)),
  row: (i: number) => pieceAt(1 - ((n - i) * layout.rowHeight) / layout.height(n)),
});
const CURTAIN_AT = reach(0.85); // the first image: as the intro's curtain lands

// The seals' drop, one ribbon a step after the other. (On the case page they're
// a size up from the cards': 36/30 wide instead of 28/24, the label in step.)
const sealsEnter = { at: pieceAt(0), step: STAGGER };



const DEFAULT_ROW_HEIGHT = 728;
const CONTENT_W = 1400; // desktop content width (20px margins)
const GAP = 20; // desktop gap between blocks

// Desktop columns (20px margin + 335px cols + 20px gaps), as on the home.
const COLS = [20, 375, 730, 1085];
const COL_W = 335;
// The case title matches the home's headings in the same kind of box: the
// Services statement on desktop (55), the hero heading on mobile (47).
const TITLE_SIZE = 55;
const TITLE_SIZE_MOBILE = 47;
const TITLE_BOX_M = 340; // the mobile title box's height (at least)
// Mobile columns (10px margin + 77.5px cols + 10px gaps).
const COLS_M = [10, 97.5, 185, 272.5];
const COL_W_M = 77.5;

function Grid({ cols, width, unit }: { cols: number[]; width: number; unit: (px: number) => string }) {
  return cols.map((left) => (
    <span
      key={left}
      aria-hidden
      className="absolute top-0 bottom-0 border-x border-line"
      style={{ left: unit(left), width: unit(width) }}
    />
  ));
}

// The home's tags (projects.ts), on the same canvas scale.
function Tag({ label, unit, variant }: { label: string; unit: (px: number) => string; variant: TagsVariant }) {
  return (
    <span
      className="flex items-center justify-center rounded-full bg-white font-mono leading-none text-ink"
      style={tagStyle(unit, variant)}
    >
      {label}
    </span>
  );
}

/** A "More works" card, linking to its case: image with its tags, name below; the image drifts and zooms like the home's. */
function WorkCard({
  project,
  unit,
  imageHeight,
  titleSize,
  variant,
  frame,
}: {
  project: Project;
  unit: (px: number) => string;
  imageHeight: number;
  titleSize: number;
  /** Which canvas it's on: sizes its tags and seals like the home's cards. */
  variant: TagsVariant;
  /** The card's width and the canvas it sits on, in design px. */
  frame: { width: number; canvas: number };
}) {
  return (
    <Link href={project.href ?? "/"} className="flex flex-col" style={{ gap: unit(12) }}>
      <div className="group relative w-full overflow-hidden" data-project-card style={{ height: unit(imageHeight) }}>
        <ParallaxImage src={project.image} alt={project.name} frame={{ ...frame, height: imageHeight }} objectPosition={project.objectPosition} />
        {project.seals && <Seals seals={project.seals} unit={unit} width={variant === "desktop" ? 28 : 24} textSize={variant === "desktop" ? 13.7 : 11.4} />}
        <div
          className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-start"
          style={tagsBoxStyle(unit, variant)}
        >
          {project.tags.map((tag) => (
            <Tag key={tag} label={tag} unit={unit} variant={variant} />
          ))}
        </div>
      </div>
      <p className="font-serif leading-none text-ink" style={{ paddingInline: unit(12), fontSize: unit(titleSize) }}>
        <ItalicI>{project.name}</ItalicI>
      </p>
    </Link>
  );
}

/** A block's content: an image, or a Vimeo video playing as a silent
 *  background loop (the player's background mode: autoplay, loop, muted, no
 *  controls; `dnt` so it sets no tracking cookies). */
function BlockMedia({ block, sizes, eager }: { block: CaseBlock; sizes: string; eager?: boolean }) {
  if ("vimeo" in block) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${block.vimeo}?background=1&dnt=1`}
        title={block.alt}
        allow="autoplay; fullscreen; picture-in-picture"
        loading={eager ? "eager" : "lazy"}
        // 2px past the block on every side (clipped by it): the player fits
        // the video inside itself on whole pixels, which on a fractional
        // (cqw-sized) block leaves a sub-pixel sliver of the backdrop showing
        // along an edge — a dark hairline over a light video.
        // (An iframe doesn't stretch between insets, so it's sized explicitly.)
        className="pointer-events-none absolute border-0"
        style={{ top: -2, left: -2, width: "calc(100% + 4px)", height: "calc(100% + 4px)" }}
      />
    );
  }
  const { src, alt, objectPosition } = block;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      className="object-cover"
      style={{ objectPosition }}
    />
  );
}

/** A facts value; with an `href`, a link out (new tab), underlining on hover. */
function FactValue({ fact }: { fact: Case["facts"][number] }) {
  if (!fact.href) return fact.value;
  return (
    <a
      href={fact.href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline-offset-[0.25em] hover:underline"
    >
      {fact.value}
    </a>
  );
}

/** The intro text: one paragraph per blank-line-separated chunk, a line apart. */
function Summary({ text }: { text: string }) {
  return text.split("\n\n").map((paragraph, i) => (
    <span key={i} className={`block ${i > 0 ? "mt-[1.4em]" : ""}`}>
      {paragraph}
    </span>
  ));
}

const blockKey = (block: CaseBlock) => ("vimeo" in block ? block.vimeo : block.src);
// A block's backdrop while its image or video loads: the near-black green the
// OnProfit work sits on, so a video doesn't flash a blank frame first.
const BLOCK_BG = "#06120d";

// A row whose image asks for white bands above and below it (CaseImage.padY):
// the bands' height on each canvas, in its design px. The row grows by both,
// so the image keeps its proportions.
const PAD_DESKTOP = 20;
const PAD_TABLET = 20;
const PAD_MOBILE = 10;
const isPadded = (row: Case["rows"][number]) => row.images.some((b) => "padY" in b && !!b.padY);

/** The block's media, inset by the white bands when the row has them. */
function Inset({ pad, children }: { pad?: string; children: ReactNode }) {
  if (!pad) return children;
  return (
    <div className="absolute inset-x-0" style={{ top: pad, bottom: pad }}>
      {children}
    </div>
  );
}

/** A block's frame; the page's very first image opens like a curtain, from the
 *  top down (`.curtain-block`, as the intro's boxes), on the site's entrance
 *  curve, right after the intro's texts. */
function Block({ first, className, style, children }: { first: boolean; className: string; style: CSSProperties; children: ReactNode }) {
  return (
    <div className={`${className} ${first ? "curtain-block" : ""}`} style={{ ...style, ...(first ? timing(CURTAIN_AT) : {}) }}>
      {children}
    </div>
  );
}

// "More works": the other cases, in their order in CASES — only projects that
// have a case page, so every card leads somewhere.
const moreWorksOf = (c: Case) =>
  CASES.filter((other) => other.slug !== c.slug)
    .map((other) => projectByName(other.title))
    .filter((p): p is Project => !!p?.href)
    .slice(0, 3);

/* ------------------------------------------------------------------ desktop */

// "More works ↘": the title row and hairline of the home's section titles (a
// 24px row with the 18px label's cap height centred in it, the hairline 20px
// under the label's baseline).
const ROW = 24;
const LABEL_CAP = 18 * 0.71;

function CaseDesktop({ data }: { data: Case }) {
  const works = moreWorksOf(data);

  return (
    <div className="hidden w-full landscape-tablet:block portrait-tablet:hidden" style={{ containerType: "inline-size" }}>
      <ProjectCursor />
      <div
        className="relative w-full"
        style={{ paddingTop: `calc(var(--header-bottom) + ${u(20)})`, paddingInline: u(20), paddingBottom: u(200) }}
      >
        <Grid cols={COLS} width={COL_W} unit={u} />

        {/* Intro (Figma 2:94 + 2:81): two 690×410 boxes (taller when a
            longer summary needs it) */}
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(2, ${u(690)})`, columnGap: u(GAP), minHeight: u(410) }}>
          <Curtain at={BOX_AT} lineAt={LINE_AT}>
            <div className="relative flex h-full items-end overflow-clip border border-t-0 border-line bg-canvas">
              {data.seals && <Seals seals={data.seals} unit={u} width={36} textSize={17.6} side="left" inset={20} enter={sealsEnter} />}
              <div className="flex flex-col" style={{ padding: u(20), gap: u(20) }}>
                <h1 className={`${DROP} font-serif leading-none text-ink`} style={{ fontSize: u(TITLE_SIZE), ...timing(introAt(INTRO_DESKTOP, data.facts.length).title) }}>
                  <ItalicI>{data.title}</ItalicI>
                </h1>
                <p
                  className={`${DROP} font-mono text-muted`}
                  style={{ fontSize: u(16), lineHeight: 1.4, letterSpacing: "-0.03em", ...timing(introAt(INTRO_DESKTOP, data.facts.length).summary) }}
                >
                  <Summary text={data.summary} />
                </p>
              </div>
            </div>
          </Curtain>

          <Curtain at={BOX_AT} lineAt={LINE_AT}>
            <dl
              className="flex h-full flex-col justify-end overflow-clip border border-t-0 border-line bg-canvas font-mono"
              style={{ fontSize: u(18), lineHeight: 1.4, letterSpacing: "-0.03em" }}
            >
              {data.facts.map((fact, i) => (
                <div
                  key={fact.label}
                  className={`${DROP} flex items-center justify-between border-t border-line`}
                  style={{ height: u(60), paddingInline: u(20), ...timing(introAt(INTRO_DESKTOP, data.facts.length).row(i)) }}
                >
                  <dt className="whitespace-nowrap text-muted">
                    {fact.label}
                  </dt>
                  <dd className="whitespace-nowrap text-black">
                    <FactValue fact={fact} />
                  </dd>
                </div>
              ))}
            </dl>
          </Curtain>
        </div>

        {/* Image blocks, row by row, edge to edge (no gaps between them, as on Behance) */}
        <div className="relative flex flex-col" style={{ marginTop: u(GAP) }}>
          {data.rows.map((row, r) => {
            const n = row.images.length;
            const cellW = CONTENT_W / n;
            return (
              <div key={r} className="flex" style={{ height: u((row.height ?? DEFAULT_ROW_HEIGHT) + (isPadded(row) ? 2 * PAD_DESKTOP : 0)) }}>
                {row.images.map((block, i) => (
                  <Block key={blockKey(block)} first={r === 0 && i === 0} className="relative h-full overflow-hidden" style={{ width: u(cellW), backgroundColor: isPadded(row) ? "#fff" : BLOCK_BG }}>
                    <Inset pad={isPadded(row) ? u(PAD_DESKTOP) : undefined}>
                      <BlockMedia block={block} sizes={`${Math.round((cellW / 1440) * 100)}vw`} eager={r === 0} />
                    </Inset>
                  </Block>
                ))}
              </div>
            );
          })}
        </div>

        {/* More works (Figma 2:131): the title + CTA in the first column, three cards after it */}
        {works.length > 0 && (
          <Reveal
            className="relative grid"
            style={{ marginTop: u(200), gridTemplateColumns: `repeat(4, ${u(COL_W)})`, columnGap: u(GAP) }}
            rootMargin="0px 0px -20% 0px"
          >
            <div className="flex flex-col justify-between" style={{ height: u(448) }}>
              <div>
                <div
                  className="rise flex items-center justify-between text-muted"
                  style={{ height: u(ROW), paddingInline: u(20), fontSize: u(18), lineHeight: 1.4, ...timing(0) }}
                >
                  <h2 className="whitespace-nowrap font-mono font-normal [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
                    More works
                  </h2>
                  <ArrowIcon glyph="down-right" style={{ width: u(24), height: u(24) }} />
                </div>
                <div
                  aria-hidden
                  className="draw bg-line"
                  style={{ marginTop: u(20 - (ROW - LABEL_CAP) / 2), height: 1, ...timing(0.1) }}
                />
              </div>
              <div className="rise" style={{ marginInline: u(20), height: u(56), ...timing(0.3) }}>
                <HeroCTA label="See more projects" icon="plus" href="/" fontSize={u(28)} iconSize={u(24)} paddingLeft={u(24)} paddingRight={u(20)} />
              </div>
            </div>

            {works.map((project, i) => (
              <div key={project.name} className="rise" style={timing(0.15 + i * STAGGER)}>
                <WorkCard project={project} unit={u} imageHeight={448} titleSize={36} variant="desktop" frame={{ width: COL_W, canvas: 1440 }} />
              </div>
            ))}
          </Reveal>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- portrait tablet */

// The desktop on the portrait tablet's 2 columns (820px frame, as the home's
// TabletCanvas): the intro's two boxes stacked full width (the facts table
// straight under the title box, one curtain, as on mobile — side by side they
// would be too narrow for the longer facts), the blocks at the full content
// width with their desktop proportions, then "More works" on the 2 columns.
const CONTENT_W_T = 780;
const COLS_T = [20, 420];
const COL_W_T = 380;
const TITLE_SIZE_TABLET = 64;
const TITLE_BOX_T = 360; // the title box's height (at least)
const INTRO_TABLET: IntroLayout = { height: (n) => TITLE_BOX_T + n * 60, title: 130, summary: 214, rowHeight: 60 };
const WORK_IMAGE_T = 460;

function CaseTablet({ data }: { data: Case }) {
  const works = moreWorksOf(data);
  const at = introAt(INTRO_TABLET, data.facts.length);

  return (
    <div className="hidden w-full portrait-tablet:block" style={{ containerType: "inline-size" }}>
      <ProjectCursor />
      <div
        className="relative w-full"
        style={{ paddingTop: `calc(var(--header-bottom) + ${ut(20)})`, paddingInline: ut(20), paddingBottom: ut(160) }}
      >
        <Grid cols={COLS_T} width={COL_W_T} unit={ut} />

        <div className="relative flex flex-col" style={{ gap: ut(GAP) }}>
          <Curtain at={BOX_AT} lineAt={LINE_AT}>
            <div
              className="relative flex flex-col justify-end overflow-clip border border-t-0 border-line bg-canvas"
              style={{ minHeight: ut(TITLE_BOX_T), padding: ut(20), gap: ut(20) }}
            >
              {data.seals && <Seals seals={data.seals} unit={ut} width={36} textSize={17.6} side="left" inset={20} enter={sealsEnter} />}
              <h1 className={`${DROP} font-serif leading-none text-ink`} style={{ fontSize: ut(TITLE_SIZE_TABLET), ...timing(at.title) }}>
                <ItalicI>{data.title}</ItalicI>
              </h1>
              <p
                className={`${DROP} font-mono text-muted`}
                style={{ fontSize: ut(18), lineHeight: 1.4, letterSpacing: "-0.03em", ...timing(at.summary) }}
              >
                <Summary text={data.summary} />
              </p>
            </div>

            <dl
              className="flex flex-col overflow-clip border border-t-0 border-line bg-canvas font-mono"
              style={{ fontSize: ut(18), lineHeight: 1.4, letterSpacing: "-0.03em" }}
            >
              {data.facts.map((fact, i) => (
                <div
                  key={fact.label}
                  className={`${DROP} flex items-center justify-between ${i > 0 ? "border-t border-line" : ""}`}
                  style={{ height: ut(60), paddingInline: ut(20), gap: ut(20), ...timing(at.row(i)) }}
                >
                  <dt className="whitespace-nowrap text-muted">{fact.label}</dt>
                  <dd className="whitespace-nowrap text-black">
                    <FactValue fact={fact} />
                  </dd>
                </div>
              ))}
            </dl>
          </Curtain>

          {/* Image blocks, row by row and edge to edge: the desktop's rows scaled to the content width */}
          <div className="flex flex-col">
            {data.rows.map((row, r) => {
              const n = row.images.length;
              const cellW = CONTENT_W_T / n;
              const height = ((row.height ?? DEFAULT_ROW_HEIGHT) * CONTENT_W_T) / CONTENT_W + (isPadded(row) ? 2 * PAD_TABLET : 0);
              return (
                <div key={r} className="flex" style={{ height: ut(height) }}>
                  {row.images.map((block, i) => (
                    <Block key={blockKey(block)} first={r === 0 && i === 0} className="relative h-full overflow-hidden" style={{ width: ut(cellW), backgroundColor: isPadded(row) ? "#fff" : BLOCK_BG }}>
                      <Inset pad={isPadded(row) ? ut(PAD_TABLET) : undefined}>
                        <BlockMedia block={block} sizes={`${Math.round((cellW / 820) * 100)}vw`} eager={r === 0} />
                      </Inset>
                    </Block>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* More works: the title row across both columns, the cards on the
            2 columns, "See more projects" in the cell after the last card */}
        {works.length > 0 && (
          <Reveal className="relative" style={{ marginTop: ut(160) }} rootMargin="0px 0px -20% 0px">
            <div
              className="rise flex items-center justify-between text-muted"
              style={{ height: ut(ROW), paddingInline: ut(20), fontSize: ut(18), lineHeight: 1.4, ...timing(0) }}
            >
              <h2 className="whitespace-nowrap font-mono font-normal [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
                More works
              </h2>
              <ArrowIcon glyph="down" style={{ width: ut(24), height: ut(24) }} />
            </div>
            <div
              aria-hidden
              className="draw bg-line"
              style={{ marginTop: ut(20 - (ROW - LABEL_CAP) / 2), height: 1, ...timing(0.1) }}
            />

            <div
              className="grid"
              style={{ marginTop: ut(20), gridTemplateColumns: `repeat(2, ${ut(COL_W_T)})`, columnGap: ut(GAP), rowGap: ut(80) }}
            >
              {works.map((project, i) => (
                <div key={project.name} className="rise" style={timing(0.15 + i * STAGGER)}>
                  <WorkCard project={project} unit={ut} imageHeight={WORK_IMAGE_T} titleSize={32} variant="desktop" frame={{ width: COL_W_T, canvas: 820 }} />
                </div>
              ))}
              <div className="flex flex-col justify-end" style={{ height: ut(WORK_IMAGE_T) }}>
                <div className="rise" style={{ marginInline: ut(20), height: ut(56), ...timing(0.3) }}>
                  <HeroCTA label="See more projects" icon="plus" href="/" fontSize={ut(28)} iconSize={ut(24)} paddingLeft={ut(24)} paddingRight={ut(20)} />
                </div>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- mobile */

// No mobile frame in Figma yet: the desktop stacked on the home's 360px grid —
// the intro boxes one above the other, every block full width (keeping its
// desktop proportions), then "More works" as a column of cards.
const CONTENT_W_M = 340;
const GAP_M = 10;

function CaseMobile({ data }: { data: Case }) {
  const works = moreWorksOf(data);

  return (
    <div className="w-full landscape-tablet:hidden" style={{ containerType: "inline-size" }}>
      <div
        className="relative w-full"
        style={{ paddingTop: `calc(var(--header-bottom) + ${um(GAP_M)})`, paddingInline: um(10), paddingBottom: um(100) }}
      >
        <Grid cols={COLS_M} width={COL_W_M} unit={um} />

        <div className="relative flex flex-col" style={{ gap: um(GAP_M) }}>
          {/* Intro: the title box with the facts table straight under it, as
              one block (the table drops its top border so the seam stays 1px),
              wiped in by one curtain. */}
          <Curtain at={BOX_AT} lineAt={LINE_AT}>
              <div
                className="relative flex flex-col justify-end overflow-clip border border-t-0 border-line bg-canvas"
                style={{ minHeight: um(TITLE_BOX_M), paddingBlock: um(16), paddingInline: um(10), gap: um(16) }}
              >
                {data.seals && <Seals seals={data.seals} unit={um} width={30} textSize={14.3} side="left" inset={10} enter={sealsEnter} />}
                <h1 className={`${DROP} font-serif leading-none text-ink`} style={{ fontSize: um(TITLE_SIZE_MOBILE), ...timing(introAt(INTRO_MOBILE, data.facts.length).title) }}>
                  <ItalicI>{data.title}</ItalicI>
                </h1>
                <p className={`${DROP} font-mono text-muted`} style={{ fontSize: um(14), lineHeight: 1.4, ...timing(introAt(INTRO_MOBILE, data.facts.length).summary) }}>
                  <Summary text={data.summary} />
                </p>
              </div>

              <dl
                className="flex flex-col overflow-clip border border-t-0 border-line bg-canvas font-mono"
                style={{ fontSize: um(14), lineHeight: 1.4, letterSpacing: "-0.03em" }}
              >
                {data.facts.map((fact, i) => (
                  <div
                    key={fact.label}
                    className={`${DROP} flex items-center justify-between ${i > 0 ? "border-t border-line" : ""}`}
                    style={{ height: um(48), paddingInline: um(10), gap: um(16), ...timing(introAt(INTRO_MOBILE, data.facts.length).row(i)) }}
                  >
                    <dt className="whitespace-nowrap text-muted">
                      {fact.label}
                    </dt>
                    <dd className="text-right text-black">
                      <FactValue fact={fact} />
                    </dd>
                  </div>
                ))}
              </dl>
          </Curtain>

          {/* Image blocks, stacked edge to edge */}
          <div className="flex flex-col">
            {data.rows.flatMap((row, r) => {
              const n = row.images.length;
              const cellW = CONTENT_W / n;
              const height = ((row.height ?? DEFAULT_ROW_HEIGHT) * CONTENT_W_M) / cellW + (isPadded(row) ? 2 * PAD_MOBILE : 0);
              return row.images.map((block, i) => (
                <Block key={blockKey(block)} first={r === 0 && i === 0} className="relative w-full overflow-hidden" style={{ height: um(height), backgroundColor: isPadded(row) ? "#fff" : BLOCK_BG }}>
                  <Inset pad={isPadded(row) ? um(PAD_MOBILE) : undefined}>
                    <BlockMedia block={block} sizes="95vw" eager={r === 0} />
                  </Inset>
                </Block>
              ));
            })}
          </div>
        </div>

        {/* More works */}
        {works.length > 0 && (
          <div className="relative flex flex-col" style={{ marginTop: um(100), gap: um(40) }}>
            <Reveal>
              <div
                className="rise flex items-center justify-between text-muted"
                style={{ paddingInline: um(10), fontSize: um(16), lineHeight: 1.4, ...timing(0) }}
              >
                <h2 className="whitespace-nowrap font-mono font-normal">More works</h2>
                <ArrowIcon glyph="down" style={{ width: um(20), height: um(20) }} />
              </div>
              <div aria-hidden className="draw bg-line" style={{ marginTop: um(16), height: 1, ...timing(0.1) }} />
            </Reveal>

            {works.map((project) => (
              <Reveal key={project.name}>
                <div className="rise" style={timing(0)}>
                  <WorkCard project={project} unit={um} imageHeight={328} titleSize={32} variant="mobile" frame={{ width: 340, canvas: 360 }} />
                </div>
              </Reveal>
            ))}

            <Reveal style={{ marginInline: um(10), height: um(52) }}>
              <div className="rise h-full" style={timing(0)}>
                <HeroCTA label="See more projects" icon="plus" href="/" fontSize={um(24)} iconSize={um(22)} paddingLeft={um(22)} paddingRight={um(18)} />
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseCanvas({ data }: { data: Case }) {
  return (
    <>
      <CaseDesktop data={data} />
      <CaseTablet data={data} />
      <CaseMobile data={data} />
    </>
  );
}
