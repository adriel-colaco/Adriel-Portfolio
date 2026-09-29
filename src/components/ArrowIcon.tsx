import type { CSSProperties } from "react";

/**
 * The site's line icons, all 24×24 with a 2px round stroke: the CTA pills' ↗
 * ("Get in touch", Figma node 20:1140) and "+" ("See all projects"), and the
 * arrow beside the "Recent work" and "Capabilities" labels — ↘ on desktop
 * (Figma node 31:85), ↓ on mobile, where the content simply continues below
 * (Figma node 20:1143).
 * Drawn with currentColor so they follow the text colour and the CTA's hover
 * swap.
 */
const PATHS = {
  "up-right": ["M7 7H17V17", "M7 17L17 7"],
  plus: ["M12 5V19", "M5 12H19"],
  "down-right": ["M17 7V17H7", "M7 7L17 17"],
  down: ["M19.0703 12L11.9992 19.0711L4.92818 12", "M11.9992 4.92893L11.9992 19.0711"],
} as const;

export default function ArrowIcon({
  glyph,
  className,
  style,
}: {
  glyph: keyof typeof PATHS;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={`block shrink-0 ${className ?? ""}`} style={style}>
      {PATHS[glyph].map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
