import type { CSSProperties } from "react";

/** The Linha-section portrait: simply there, no entrance of its own. */
export default function Portrait({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/figma/adriel-bw.png" alt="Adriel Colaço" className="h-full w-full object-cover" />
    </div>
  );
}
