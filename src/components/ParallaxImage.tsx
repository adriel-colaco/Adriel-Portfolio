"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { subscribe, prefersReducedMotion, LERP } from "./parallaxTicker";
import { coverAspect } from "./projects";

const SCALE = 1.18; // zoom that creates the drift head-room (9% each side)

/** The frame the image fills, in design px on a canvas `canvas` px wide. */
export type ImageFrame = { width: number; height: number; canvas: number };

/**
 * The image's `sizes`: how wide it's actually drawn, not just its frame. It
 * covers the frame (so a cover wider than the frame's shape overflows its
 * sides) and is zoomed by SCALE for the drift, so a portrait card showing a
 * landscape cover needs a file well over the card's width to stay sharp.
 */
function coverSizes(src: string, { width, height, canvas }: ImageFrame) {
  const drawn = Math.max(width, height * coverAspect(src)) * SCALE;
  return `${Math.ceil((drawn / canvas) * 100)}vw`;
}

type ParallaxImageProps = {
  src: string;
  alt: string;
  frame: ImageFrame;
  objectPosition?: string;
  /** Max vertical travel as a fraction of the frame height (must stay < 9%). */
  travel?: number;
};

/**
 * Image that gently drifts inside its (overflow-hidden) frame as the page
 * scrolls, easing toward its target so it keeps moving briefly after the scroll
 * stops — the Studio X feel. Disabled when the user prefers reduced motion.
 *
 * The parallax translate + head-room scale live on the wrapper (driven by JS),
 * while the hover zoom is a CSS transition on the inner image — two separate
 * transforms so the hover eases smoothly without the JS clobbering it.
 */
export default function ParallaxImage({
  src,
  alt,
  frame,
  objectPosition = "center",
  travel = 0.08,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = ref.current;
    const frame = wrap?.parentElement;
    if (!wrap || !frame) return;
    if (prefersReducedMotion()) return;

    let current = 0;
    const step = () => {
      const rect = frame.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      const center = rect.top + rect.height / 2;
      const target = Math.max(
        -1,
        Math.min(1, (center - vh / 2) / (vh / 2 + rect.height / 2)),
      );
      current += (target - current) * LERP;
      const shift = current * rect.height * travel;
      wrap.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${SCALE})`;
    };

    return subscribe(step);
  }, [travel]);

  return (
    <div
      ref={ref}
      className="absolute inset-0 will-change-transform"
      style={{ transform: `scale(${SCALE})` }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={coverSizes(src, frame)}
        className="object-cover transition-transform duration-(--dur-ui) ease-(--ease-ui) group-hover:scale-[1.06]"
        style={{ objectPosition }}
      />
    </div>
  );
}
