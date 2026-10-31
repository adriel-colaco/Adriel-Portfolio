/**
 * The home's options. The home ships v1: the blue glow at the top, and the
 * hero scrolling away a little slower than the page. (A v2 — no glow, the hero
 * pinned and blurring away under the cards, PinnedFade's `pinned` mode — was
 * tried and set aside; it's one flag away.)
 */
export type HomeVariant = { glow: boolean; pinnedHero: boolean };

export const HOME_V1: HomeVariant = { glow: true, pinnedHero: false };
