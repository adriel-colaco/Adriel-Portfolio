import { Fragment } from "react";

/**
 * Renders text in the Instrument Serif style used across the design, where every
 * "i" (including the accented "í") is set in italic for a subtle typographic
 * flourish (e.g. "Des*i*gn", "In*í*c*i*o").
 */
export default function ItalicI({ children }: { children: string }) {
  return (
    <>
      {children.split(/([ií])/g).map((part, index) =>
        part === "i" || part === "í" ? (
          <em key={index} className="italic">
            {part}
          </em>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
