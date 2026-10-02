"use client";

import { useRef } from "react";
import ArrowIcon from "./ArrowIcon";
import type { ComponentProps } from "react";
import { useMagnetPull } from "./useMagnetPull";
import { externalProps } from "./contact";

/**
 * The site's white CTA pill — "Get in touch" in the hero (Figma node 20:1137),
 * "See all projects" under the cards (24:401): the serif label on the left and
 * an icon on the right (↗ to get in touch, "+" to see more). Sizes are passed in so the desktop (1440 frame) and
 * mobile (360 frame) canvases can each scale it with their own `cqw` helper.
 * The icon uses currentColor so the hover swap in globals.css (`.hero-cta`)
 * recolours label and glyph together — and turns the icon: the ↗ tips over
 * to point right, the "+" spins a quarter turn, landing just as it was
 * (`.hero-cta-tilt` / `.hero-cta-spin`). Like the footer's contact pills,
 * `data-cursor-magnet` lets the trailing cursor dot snap into it, and the label
 * and the icon each drift subtly toward the cursor while it's near (useMagnetPull).
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
  const ref = useRef<HTMLAnchorElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  useMagnetPull(ref, contentRef);

  return (
    <a
      ref={ref}
      href={href}
      {...externalProps(href)}
      data-cursor-magnet
      className="hero-cta flex h-full w-full items-center rounded-full font-serif"
      style={{ paddingLeft, paddingRight }}
    >
      {/* Label and icon are pulled separately (useMagnetPull), by how close the cursor is to each. */}
      <span ref={contentRef} className="flex flex-1 items-center justify-between">
        <span className="whitespace-nowrap leading-none" style={{ fontSize }}>
          {label}
        </span>
        <ArrowIcon
          glyph={icon}
          className={icon === "up-right" ? "hero-cta-tilt" : icon === "plus" ? "hero-cta-spin" : undefined}
          style={{ width: iconSize, height: iconSize }}
        />
      </span>
    </a>
  );
}
