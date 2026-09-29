"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./parallaxTicker";

/**
 * The Linha-section portrait, wiped into view with a soft top-to-bottom
 * "curtain" as it enters the viewport. The clip is armed on mount (so the image
 * stays fully visible if JS never runs), then an IntersectionObserver fires the
 * one-shot reveal the first time the frame scrolls in. Honours reduced motion.
 */
export default function PortraitReveal({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Arm the clip. Under reduced motion the CSS neutralises it, so revealing
    // immediately keeps the portrait visible without the wipe.
    el.dataset.armed = "";

    if (prefersReducedMotion()) {
      el.classList.add("is-revealed");
      return;
    }

    // Trigger on isIntersecting (threshold 0), never on intersectionRatio: the
    // frame is clip-path–hidden until it reveals, which some engines report as
    // ratio 0, so a ratio threshold would never fire. The negative bottom
    // rootMargin holds the reveal until the portrait is comfortably in view.
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-revealed");
            obs.disconnect();
          }
        }
      },
      { threshold: 0, rootMargin: "0px 0px -25% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`curtain-reveal ${className ?? ""}`} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/figma/adriel-bw.png"
        alt="Adriel Colaço"
        className="h-full w-full object-cover"
      />
    </div>
  );
}
