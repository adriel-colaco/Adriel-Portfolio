/**
 * A single shared requestAnimationFrame loop that drives every parallax element
 * (images and cards). One loop for all subscribers keeps things cheap, and it
 * keeps ticking while anything is subscribed — which is what lets the motion
 * ease on (lerp) for a moment *after* the scroll itself has stopped.
 */
export const LERP = 0.05; // easing factor — lower = longer, smoother glide

type Tick = () => void;
const ticks = new Set<Tick>();
let running = false;

function loop() {
  ticks.forEach((fn) => fn());
  if (ticks.size === 0) {
    running = false;
    return;
  }
  requestAnimationFrame(loop);
}

/** Subscribe a per-frame callback. Returns an unsubscribe function. */
export function subscribe(fn: Tick): () => void {
  ticks.add(fn);
  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
  return () => {
    ticks.delete(fn);
  };
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
