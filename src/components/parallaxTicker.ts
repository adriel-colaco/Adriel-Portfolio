/**
 * A single shared requestAnimationFrame loop that drives every parallax element
 * (images and cards). One loop for all subscribers keeps things cheap, and it
 * keeps ticking for a moment *after* the scroll itself has stopped — which is
 * what lets the motion ease on (lerp) — then sleeps until the next input.
 */
export const LERP = 0.05; // easing factor — lower = longer, smoother glide

type Tick = () => void;
const ticks = new Set<Tick>();
let running = false;

// The loop only runs while something is moving: it goes to sleep IDLE_MS after
// the last scroll, resize or pointer move (long enough for every eased glide to
// settle), and wakes on the next one — so a page left still costs no frames.
const IDLE_MS = 2000;
let lastActivity = 0;
const wake = () => {
  lastActivity = performance.now();
  if (!running && ticks.size > 0) {
    running = true;
    requestAnimationFrame(loop);
  }
};
if (typeof window !== "undefined") {
  for (const type of ["scroll", "resize", "pointermove", "touchmove", "wheel"]) {
    window.addEventListener(type, wake, { passive: true });
  }
}

function loop() {
  // One subscriber failing (say, an element gone mid-frame) mustn't stop the
  // loop for everyone else — every scroll-driven effect on the page runs here.
  ticks.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error(err);
    }
  });
  if (ticks.size === 0 || performance.now() - lastActivity > IDLE_MS) {
    running = false;
    return;
  }
  requestAnimationFrame(loop);
}

/** Subscribe a per-frame callback. Returns an unsubscribe function. */
export function subscribe(fn: Tick): () => void {
  ticks.add(fn);
  wake();
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
