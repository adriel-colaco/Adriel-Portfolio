"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { prefersReducedMotion, subscribe } from "./parallaxTicker";

// The scroll over which the portrait comes in: from when its top reaches this
// far down the screen (fractions of the viewport height)…
const START = 0.95;
// …until it has risen this much further — done before the quote below it
// starts writing itself out.
const SPAN = 0.4;
const ZOOM = 0.18; // the photo starts this much larger and settles to 1
const BLUR = 18; // px, at the start

// Ease-in-out (quint) on the curtain, so it gathers pace and lands softly.
const ease = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

/**
 * The Linha-section portrait. It comes in with the scroll, as the quote under
 * it does: the frame opens like a curtain, top to bottom, its crisp edge
 * sliding down, while the photo inside settles from a slight zoom and comes
 * out of a light blur — a window opening on a picture already there. Under
 * reduced motion it's simply there.
 */
export default function Portrait({ className, style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    const clip = clipRef.current;
    const img = imgRef.current;
    if (!el || !clip || !img || prefersReducedMotion()) return;
    let cur = -1;
    const step = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const target = Math.max(0, Math.min(1, (START * vh - el.getBoundingClientRect().top) / (SPAN * vh)));
      cur = cur < 0 ? target : cur + (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      const e = ease(cur);
      // The curtain: the frame's bottom edge clipped away, less and less.
      clip.style.clipPath = e < 1 ? `inset(0 0 ${((1 - e) * 100).toFixed(2)}% 0)` : "";
      // The photo settles inside it, from a zoom and a blur, on a gentler curve.
      const s = 1 - (1 - cur) ** 3;
      img.style.transform = s < 1 ? `scale(${(1 + ZOOM * (1 - s)).toFixed(4)})` : "";
      // The blur clears more slowly than the zoom settles — on the scroll's own
      // pace — so it's still visibly soft while the curtain is opening.
      const b = BLUR * (1 - cur) ** 1.3;
      // On the frame as a whole (outside its clip), so the opening curtain's
      // edges are as soft as the photo.
      el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "";
    };
    step();
    return subscribe(step);
  }, []);

  return (
    <div ref={ref} className={className} style={{ filter: `blur(${BLUR}px)`, overflow: "visible", ...style }}>
      <div ref={clipRef} className="h-full w-full overflow-hidden" style={{ clipPath: "inset(0 0 100% 0)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/figma/adriel-bw.png"
          alt="Adriel Colaço"
          className="h-full w-full origin-top object-cover will-change-transform"
          style={{ transform: `scale(${1 + ZOOM})` }}
        />
      </div>
    </div>
  );
}
