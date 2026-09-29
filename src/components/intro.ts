import type { CSSProperties } from "react";

/**
 * The hero's entrance, as one timeline. Times are in seconds from the moment the
 * loading screen's curtain starts to lift (the CSS entrances sit paused on their
 * first frame until then — see globals.css), and every piece uses the same
 * gesture: it slides into place from behind a mask, on the same curve and
 * duration (SplitText's words, `.rise` for everything else). Everything rises
 * from its bottom edge except the header, which drops from the top edge of the
 * screen (`.rise-from-top`). Two beats, both running top to bottom, in reading
 * order:
 *
 * 1. The message — the heading, word by word. It waits for the curtain to clear
 *    the heading (~0.55–0.7s in, depending on the screen's aspect ratio), so no
 *    word plays its rise hidden underneath it.
 * 2. The interface — navbar, CTA, "Recent work" and the first row of cards, as
 *    one cascade that starts while the heading's last words are still gliding
 *    in, so the two beats flow into each other.
 */
// The hero heading (Figma 31:66): "I design <word>" on the first line, where
// <word> is typed over and over through what I design, then the tail below it.
// The tail's line breaks are fixed as designed: "agencies worldwide" fills the
// box to within a couple of pixels, so leaving it to the browser could wrap it.
export const HERO_LEAD = "I design";
export const HERO_WORDS = ["interfaces", "brands", "graphics"];
export const HERO_TAIL_LINES = ["for companies and", "agencies worldwide"];
export const HERO_TAIL = HERO_TAIL_LINES.join(" ");
// What screen readers get instead of the animation.
export const HERO_LABEL = `${HERO_LEAD} ${HERO_WORDS.slice(0, -1).join(", ")} and ${HERO_WORDS.at(-1)} ${HERO_TAIL}`;
const HERO_WORD_COUNT = `${HERO_LEAD} ${HERO_WORDS[0]} ${HERO_TAIL}`.split(" ").length;

// The feel of every entrance: an unhurried duration on a curve that eases out
// of the mask gently (no pop at the start) and then glides into place, spending
// most of its time on a long, soft landing. Both are the site's shared motion
// tokens in globals.css (--dur-enter / --ease-enter), referenced rather than
// copied, so CSS and inline styles can't drift apart — and an entrance profile
// (like the home's `data-entrance="blur"`) can redefine them for a subtree.
export const INTRO_DURATION = "var(--dur-enter)";
export const INTRO_EASE = "var(--ease-enter)";
// The interface's own curve (menu, header, hovers): reacts at once, then settles.
export const UI_EASE = "var(--ease-ui)";

export const HEADING_START = 0.6;
export const HEADING_STAGGER = 0.05;

const HEADING_END = HEADING_START + HERO_WORD_COUNT * HEADING_STAGGER;
const UI_START = HEADING_END + 0.1;
const UI_STAGGER = 0.1;
const UI_ORDER = ["nav", "cta", "recentWork", "cards"] as const;

/** When a piece of the interface beat starts (s), for chaining off it. */
export const introDelay = (piece: (typeof UI_ORDER)[number], offset = 0) =>
  UI_START + (UI_ORDER.indexOf(piece) + offset) * UI_STAGGER;

/**
 * Animation timing for a piece of the interface beat (pair it with `.rise`).
 * `offset` shifts it by whole steps (the first-row cards enter one after
 * another, left to right).
 */
export function introStyle(piece: (typeof UI_ORDER)[number], offset = 0): CSSProperties {
  const delay = introDelay(piece, offset);
  return {
    animationDelay: `${delay.toFixed(2)}s`,
    animationDuration: INTRO_DURATION,
    animationTimingFunction: INTRO_EASE,
  };
}
