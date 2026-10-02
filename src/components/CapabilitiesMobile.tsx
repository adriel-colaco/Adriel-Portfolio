"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import ArrowIcon from "./ArrowIcon";
import { CAPABILITIES_INTRO, PILLARS, useRevealOnView } from "./Capabilities";
import { Curtain, CURTAIN_DROP, CURTAIN_LEAD, curtainPieceAt, curtainTiming } from "./Curtain";

/**
 * Mobile "Capabilities" (Figma 1:108) — the desktop section stacked for a
 * narrow screen as a column of bordered cards, 20px apart: the "Capabilities ↓"
 * card with its intro, then one card per pillar — a mono title, a full-width
 * hairline, the list below.
 *
 * Every card enters on its own as it scrolls in, so they show up one after
 * another down the page, as the site's boxes do (<Curtain>, like the case
 * intro): its top hairline fades in, a curtain opens the card from it, top
 * down, and each piece — the title, the hairline under it, every line of the
 * contents — appears as the curtain's edge reaches it, dropping into place.
 * `cqw` on the 360px mobile frame; flows inside the MobileCanvas, whose column
 * strokes show in the gaps between the cards.
 */
const FRAME = 360;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

const PAD = 10; // inner side padding of the card's rows
const GAP = 16; // card padding (top/bottom) and the gap between its rows

// Where the pieces sit in a card (design px from its top): the title row
// (16px label × 1.4) under the top padding, the hairline a gap below it, the
// contents a gap below that — list items 24px tall, 12px apart — and the
// bottom padding. From these, each piece's moment in the curtain.
const TITLE_TOP = GAP;
const LINE_TOP = TITLE_TOP + 16 * 1.4 + GAP;
const CONTENT_TOP = LINE_TOP + 1 + GAP;
const ITEM_STEP = 24 + 12;
const BORDERS = 2;
// The intro paragraph's card: its text wraps to seven lines (16px × 1.4).
const INTRO_HEIGHT = CONTENT_TOP + 7 * 16 * 1.4 + GAP + BORDERS;
const pillarHeight = (items: number) => CONTENT_TOP + items * ITEM_STEP - 12 + GAP + BORDERS;

const LINE_AT = 0; // the card's top hairline fades in as it's revealed…
const BOX_AT = LINE_AT + CURTAIN_LEAD; // …and the curtain sets off from it

/** When the piece `top` px down a card `height` px tall appears, as a style. */
type PieceAt = (top: number) => CSSProperties;

function Card({
  title,
  icon,
  titleId,
  height,
  children,
}: {
  title: string;
  icon?: boolean;
  titleId?: string;
  /** The card's height in design px (for the pieces' moments in the curtain). */
  height: number;
  children: (at: PieceAt) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useRevealOnView(ref, "0px 0px -15% 0px");
  const Heading = icon ? "h2" : "h3";
  const at: PieceAt = (top) => curtainTiming(curtainPieceAt(BOX_AT, top / height));

  // The observed wrapper stays put; the card opens inside it.
  return (
    <div ref={ref}>
      <Curtain at={BOX_AT} lineAt={LINE_AT}>
        <div
          className="flex flex-col overflow-clip border border-t-0 border-line bg-canvas"
          style={{ paddingBlock: u(GAP), gap: u(GAP) }}
        >
          <div
            className={`${CURTAIN_DROP} flex items-center justify-between text-muted`}
            style={{ paddingInline: u(PAD), fontSize: u(16), lineHeight: 1.4, ...at(TITLE_TOP) }}
          >
            <Heading id={titleId} className="whitespace-nowrap font-mono font-normal text-muted">
              {title}
            </Heading>
            {icon && <ArrowIcon glyph="down" style={{ width: u(20), height: u(20) }} />}
          </div>
          {/* The hairline under the title drops into place with the texts as the edge passes it. */}
          <div aria-hidden className={`${CURTAIN_DROP} bg-line`} style={{ height: 1, ...at(LINE_TOP) }} />
          {children(at)}
        </div>
      </Curtain>
    </div>
  );
}

export default function CapabilitiesMobile() {
  return (
    <section
      aria-labelledby="capabilities-title-mobile"
      // Positioned (and lifted) so the cards paint over the canvas's absolutely
      // placed column strokes.
      className="relative z-[1] flex flex-col"
      style={{ width: u(340), marginInline: "auto", gap: u(20) }}
    >
      <Card title="Capabilities" icon titleId="capabilities-title-mobile" height={INTRO_HEIGHT}>
        {(at) => (
          <p
            className={`${CURTAIN_DROP} font-mono text-muted`}
            style={{ paddingInline: u(PAD), fontSize: u(16), lineHeight: 1.4, ...at(CONTENT_TOP) }}
          >
            {CAPABILITIES_INTRO}
          </p>
        )}
      </Card>
      {PILLARS.map((pillar) => (
        <Card key={pillar.title} title={pillar.title} height={pillarHeight(pillar.items.length)}>
          {(at) => (
            <ul
              className="flex flex-col font-serif text-ink"
              style={{ paddingLeft: u(PAD), gap: u(12), fontSize: u(24), lineHeight: 1 }}
            >
              {pillar.items.map((item, i) => (
                <li key={item} className={CURTAIN_DROP} style={at(CONTENT_TOP + i * ITEM_STEP)}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </section>
  );
}
