"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { prefersReducedMotion } from "./parallaxTicker";

const ZOOM = 0.18; // the photo starts this much larger and settles to 1
const BLUR = 18; // px, at the start
const DURATION = 1400; // ms
// The curtain gathers pace and lands softly (ease-in-out quint); the photo's
// zoom and the blur settle on the site's entrance curve.
const CURTAIN_EASE = "cubic-bezier(0.83, 0, 0.17, 1)";
const SETTLE_EASE = "cubic-bezier(0.25, 0.1, 0.1, 1)";

/**
 * The Linha-section portrait. It comes in once, the first time it scrolls into
 * view: the frame opens like a curtain, top to bottom, while the photo inside
 * settles from a slight zoom and the whole frame comes out of a blur — then it
 * simply stays (scrolling back up doesn't replay or undo it). Under reduced
 * motion it's simply there.
 */
export default function Portrait({ className, style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    const clip = clipRef.current;
    const img = imgRef.current;
    if (!el || !clip || !img) return;
    const show = () => {
      el.style.filter = "";
      clip.style.clipPath = "";
      img.style.transform = "";
    };
    if (prefersReducedMotion()) return show();

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        const opts = { duration: DURATION, fill: "forwards" as const };
        clip.animate([{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }], { ...opts, easing: CURTAIN_EASE });
        img.animate([{ transform: `scale(${1 + ZOOM})` }, { transform: "scale(1)" }], { ...opts, easing: SETTLE_EASE });
        el.animate([{ filter: `blur(${BLUR}px)` }, { filter: "blur(0px)" }], { ...opts, easing: SETTLE_EASE }).finished.then(show);
      },
      // Once it's comfortably on screen, not the instant its edge peeks in.
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ filter: `blur(${BLUR}px)`, overflow: "visible", ...style }}>
      <div ref={clipRef} className="h-full w-full overflow-hidden" style={{ clipPath: "inset(0 0 100% 0)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src="/figma/adriel-bw.webp"
          alt="Adriel Colaço"
          className="h-full w-full origin-top object-cover"
          style={{ transform: `scale(${1 + ZOOM})` }}
        />
      </div>
    </div>
  );
}
