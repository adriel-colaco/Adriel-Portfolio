"use client";

import ArrowIcon from "./ArrowIcon";
import ItalicI from "./ItalicI";
import type { ComponentProps } from "react";
import { externalProps } from "./contact";

/**
 * The site's white CTA pill — "Get in touch" in the hero (Figma node 20:1137),
 * "See all projects" under the cards (24:401): the serif label on the left and
 * an icon on the right (↗ to get in touch, "+" to see more). Sizes are passed in so the desktop (1440 frame) and
 * mobile (360 frame) canvases can each scale it with their own `cqw` helper.
 * On hover a soft blue glow rises from the bottom centre until it fills the
 * pill, while the dark label and icon rise away, fading out, and a white copy
 * of them rises into place from below, fading in (`.hero-cta-glow`,
 * `.hero-cta-dark` / `.hero-cta-white`). Like the footer's contact pills,
 * `data-cursor-magnet` lets the trailing cursor dot snap into it.
 */
export default function HeroCTA({
  label,
  icon = "up-right",
  href = "#",
  fontSize,
  iconSize,
  paddingLeft,
  paddingRight,
}: {
  label: string;
  icon?: ComponentProps<typeof ArrowIcon>["glyph"];
  href?: string;
  fontSize: string;
  iconSize: string;
  paddingLeft: string;
  paddingRight: string;
}) {
  const content = (className: string) => (
    <span className={`${className} flex flex-1 items-center justify-between`}>
      <span className="whitespace-nowrap leading-none" style={{ fontSize }}>
        <ItalicI>{label}</ItalicI>
      </span>
      <ArrowIcon glyph={icon} style={{ width: iconSize, height: iconSize }} />
    </span>
  );

  return (
    <a
      href={href}
      {...externalProps(href)}
      data-cursor-magnet
      className="hero-cta flex h-full w-full items-center rounded-full font-serif"
      style={{ paddingLeft, paddingRight }}
    >
      {content("hero-cta-dark")}
      {/* The hover: a soft blue glow rising from the bottom over the dark label
          and icon, then a white copy of them rising into place on top
          (globals.css). */}
      <span aria-hidden className="hero-cta-glow" />
      <span
        aria-hidden
        className="hero-cta-light"
        style={{ paddingLeft, paddingRight }}
      >
        {content("hero-cta-white")}
      </span>
    </a>
  );
}
