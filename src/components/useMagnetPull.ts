"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import { prefersReducedMotion, subscribe } from "./parallaxTicker";

// Kept deliberately subtle: a faint pull, capped at a couple of pixels.
const PAD = 14; // reacts a little beyond the pill's edge
const STRENGTH = 0.1; // fraction of the cursor offset an item follows, at full proximity
const MAX = 2; // px cap per item
const REACH = 0.75; // an item's pull fades to nothing this far from it (× pill width)
const EASE = 0.12; // per-frame easing toward the target offset

/**
 * Magnetic pull for a pill button (the footer contacts, the hero CTAs): while
 * the cursor is on or near `target`, each child of `content` (the label, the
 * icon) drifts toward it on its own, pulled harder the closer the cursor is to
 * that item — so hovering the arrow tugs the arrow while the label barely
 * stirs, and vice versa. The pill itself stays put. Runs on the shared ticker
 * so it keeps easing after the pointer stops. Off under reduced motion.
 */
export function useMagnetPull(
  target: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const el = target.current;
    const wrap = content.current;
    if (!el || !wrap || prefersReducedMotion()) return;

    const items = Array.from(wrap.children) as (HTMLElement | SVGElement)[];
    const offsets = items.map(() => ({ x: 0, y: 0 }));
    const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));

    let mx = 0;
    let my = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const unsubscribe = subscribe(() => {
      const r = el.getBoundingClientRect();
      const inside =
        mx >= r.left - PAD &&
        mx <= r.right + PAD &&
        my >= r.top - PAD &&
        my <= r.bottom + PAD;
      const reach = r.width * REACH;

      items.forEach((item, i) => {
        const o = offsets[i];
        let tx = 0;
        let ty = 0;
        if (inside) {
          // The item's resting centre (its box minus the offset we applied), so
          // its own movement doesn't feed back into the pull.
          const b = item.getBoundingClientRect();
          const dx = mx - (b.left + b.width / 2 - o.x);
          const dy = my - (b.top + b.height / 2 - o.y);
          const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / reach) ** 1.5;
          tx = clamp(dx * STRENGTH * proximity);
          ty = clamp(dy * STRENGTH * proximity);
        }
        o.x += (tx - o.x) * EASE;
        o.y += (ty - o.y) * EASE;
        item.style.transform = `translate(${o.x.toFixed(2)}px, ${o.y.toFixed(2)}px)`;
      });
    });

    return () => {
      window.removeEventListener("mousemove", onMove);
      unsubscribe();
    };
  }, [target, content]);
}
