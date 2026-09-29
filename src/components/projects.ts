/**
 * The portfolio's projects, as shown on their cards: name, cover image and
 * tags. The case pages' "More works" pull their cards from here by name.
 */
import type { CSSProperties } from "react";
import type { Seal } from "./Seals";

export type Project = {
  name: string;
  image: string;
  tags: string[];
  objectPosition?: string;
  /** Its case page, when it has one. */
  href?: string;
  /** Ribbons hung from the card's top-right corner. */
  seals?: Seal[];
};

// The OnProfit card's seals ("Gr" and "Ai"): the Behance galleries that
// featured it, as Behance names them (shown on hover; add `date` to show when).
export const ONPROFIT_SEALS: Seal[] = [
  { label: "Gr", bg: "#a89160", fg: "#ffffff", feature: "Marca" },
  { label: "Ai", bg: "#2e0502", fg: "#f19f39", feature: "Illustrator" },
];

export const PROJECTS: Project[] = [
  {
    name: "OnProfit",
    image: "/projects/onprofit.webp",
    tags: ["UX/UI", "3D", "Art Direction"],
    href: "/cases/onprofit",
    seals: ONPROFIT_SEALS,
  },
  { name: "FTD Educação", image: "/projects/ftd.jpg", tags: ["UX/UI"], objectPosition: "center top" },
  { name: "Heineken", image: "/projects/heineken.jpg", tags: ["UX/UI"] },
  { name: "TCL SEMP", image: "/projects/tcl.jpg", tags: ["UX/UI"], objectPosition: "center bottom" },
  { name: "Farol Santander", image: "/projects/farol.jpg", tags: ["UX/UI"], objectPosition: "center bottom" },
  { name: "Hungara Lanches", image: "/projects/hungara.jpg", tags: ["UX/UI", "Illustration"] },
  { name: "Holly Bakehouse", image: "/projects/holly.jpg", tags: ["Illustration"] },
  { name: "Trivium", image: "/projects/trivium.jpg", tags: ["UX/UI", "Illustration"], objectPosition: "center top" },
  { name: "Remapp", image: "/projects/remapp.jpg", tags: ["3D", "Illustration"] },
];

// A card's tags: small mono labels on white pills — kept quiet so they read as
// labels, not buttons. One set per canvas (design px on the 1440 desktop frame
// and the 360 mobile one): label size, pill padding [inline, block], the gap
// between pills, the box's inset from the image's corner, and the width they
// wrap within (inset included), as Figma's "Tags container" does — short pairs
// share a row, but a third tag like OnProfit's "Art Direction" drops to its own.
export const TAGS = {
  desktop: { size: 13, pad: [12, 7], gap: 5, inset: 12, maxWidth: 224 },
  mobile: { size: 11, pad: [9, 6], gap: 4, inset: 12, maxWidth: 189 },
} as const;
export type TagsVariant = keyof typeof TAGS;

type Unit = (px: number) => string;

/** A tag pill's style (pair it with the pill classes). */
export function tagStyle(unit: Unit, variant: TagsVariant): CSSProperties {
  const { size, pad } = TAGS[variant];
  return { paddingInline: unit(pad[0]), paddingBlock: unit(pad[1]), fontSize: unit(size), letterSpacing: "-0.03em" };
}

/** The tags box's style: pinned to the image's bottom-left, wrapping in rows. */
export function tagsBoxStyle(unit: Unit, variant: TagsVariant): CSSProperties {
  const { gap, inset, maxWidth } = TAGS[variant];
  return { maxWidth: unit(maxWidth), padding: unit(inset), gap: unit(gap) };
}

// Cover images' aspect ratios (width / height), so their cards can ask for a
// big enough file (see ParallaxImage). Most covers are 1920×1726 exports; list
// any that differ here.
const COVER_ASPECT = 1920 / 1726;
const COVER_ASPECTS: Record<string, number> = {
  "/projects/onprofit.webp": 1948 / 2000,
};
export const coverAspect = (src: string) => COVER_ASPECTS[src] ?? COVER_ASPECT;

export const projectByName = (name: string) => PROJECTS.find((p) => p.name === name);
