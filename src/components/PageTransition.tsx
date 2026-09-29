"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { prefersReducedMotion } from "./parallaxTicker";
import { markSiteLoaded } from "./siteLoaded";

// The loader's blue, thinning out along a cosine (ease-in-out) curve: [position
// through the fade, alpha] from the solid edge out, finely stepped so the blue
// melts away with no visible band anywhere along it.
const BLUE = "0 31 255";
const FADE_STEPS = 16;
const FADE = Array.from({ length: FADE_STEPS + 1 }, (_, i) => {
  const t = i / FADE_STEPS;
  return [t, +((1 + Math.cos(Math.PI * t)) / 2).toFixed(3)] as const;
});

// The curtain, in viewport heights: a long soft head, a solid screenful, and a
// long soft tail — each almost a screen tall, so both edges are a slow haze.
const HEAD = 90;
const TAIL = 90;
const SPAN = HEAD + 100 + TAIL;

// Kept short so it never gets in the way: it covers the page in COVER_MS, the
// route changes underneath, then it clears off the top in REVEAL_MS — the
// loader's lift, quickened. The curve is the loader's ease-in-out, so both
// moves start and stop out of sight (the screen is solid blue at the seam).
const COVER_MS = 500;
const REVEAL_MS = 750;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
// If the new page never arrives (a failed or cancelled navigation), clear anyway.
const GIVE_UP_MS = 2500;
// Smoothness: once the new page is in, the lift waits for the main thread to
// be free (its mount — hydration, images, players — done), up to SETTLE_MS, so
// the curtain doesn't set off in a busy frame; and the page's entrances are let
// go RELEASE_MS into the lift (the screen still almost all blue), so their
// restyle doesn't land on its first frames either.
const SETTLE_MS = 300;
const RELEASE_MS = 120;

/** The gradient along the curtain: fades in over the head, solid, fades out over the tail. */
function curtainBackground() {
  const pct = (vh: number) => `${((vh / SPAN) * 100).toFixed(2)}%`;
  const head = [...FADE].reverse().map(([at, a]) => `rgb(${BLUE} / ${a}) ${pct(HEAD * (1 - at))}`);
  const tail = FADE.map(([at, a]) => `rgb(${BLUE} / ${a}) ${pct(HEAD + 100 + TAIL * at)}`);
  return `linear-gradient(to bottom, ${[...head, ...tail].join(", ")})`;
}

const at = (vh: number) => `translate3d(0, ${vh}vh, 0)`;

/**
 * Page transitions: clicking a link to another page of the site sends the
 * loader's blue curtain up from the bottom of the screen — its soft head first —
 * until it covers the page; the route changes underneath, and the curtain
 * carries on up and off the top, trailing the same soft tail as the loader's,
 * uncovering the new page. While it's covered, the page's CSS entrances are
 * held on their first frame (html[data-page-cover], globals.css), so they play
 * as it's uncovered rather than beneath it.
 *
 * It catches clicks on any same-site link (Next's <Link>s and plain <a>s alike)
 * in the capture phase and cancels their own navigation — a <Link> still runs
 * its onClick (closing the menu, say), then sees the event handled and stands
 * aside — and navigates itself once the page is covered. Left alone: links to
 * the page you're on (and #hashes), other sites, new tabs, downloads, clicks
 * with a modifier, the browser's back/forward, and everything under reduced
 * motion.
 */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const phase = useRef<"idle" | "covering" | "covered" | "revealing">("idle");
  const giveUp = useRef(0);

  const reveal = () => {
    const el = ref.current;
    if (!el || phase.current !== "covered") return;
    phase.current = "revealing";
    window.clearTimeout(giveUp.current);
    // Let the new page's entrances go as it's uncovered.
    window.setTimeout(() => delete document.documentElement.dataset.pageCover, RELEASE_MS);
    const lift = el.animate([{ transform: at(-HEAD) }, { transform: at(-SPAN) }], {
      duration: REVEAL_MS,
      easing: EASE,
      fill: "forwards",
    });
    lift.finished.then(() => {
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
      phase.current = "idle";
    });
  };

  // Intercept same-site link clicks.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (prefersReducedMotion()) return;

      e.preventDefault();
      const el = ref.current;
      if (!el || phase.current !== "idle") return;

      phase.current = "covering";
      // Once past the home's loader, it shouldn't greet you there on top of this.
      markSiteLoaded();
      el.style.visibility = "visible";
      el.style.pointerEvents = "auto"; // no clicks through it mid-transition
      const cover = el.animate([{ transform: at(100) }, { transform: at(-HEAD) }], {
        duration: COVER_MS,
        easing: EASE,
        fill: "forwards",
      });
      cover.finished.then(() => {
        phase.current = "covered";
        document.documentElement.dataset.pageCover = "";
        router.push(url.pathname + url.search + url.hash);
        giveUp.current = window.setTimeout(reveal, GIVE_UP_MS);
      });
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(giveUp.current);
    };
  }, [router]);

  // The new page has rendered: uncover it once it has painted and settled.
  useEffect(() => {
    if (phase.current !== "covered") return;
    let idle = 0;
    const frame = requestAnimationFrame(() => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(reveal, { timeout: SETTLE_MS })
        : window.setTimeout(reveal, 60);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [pathname]);

  return (
    <div
      ref={ref}
      aria-hidden
      data-cursor-dark
      // Its own compositor layer from the start, so neither move pays for
      // promoting it on its first frame.
      className="pointer-events-none fixed inset-x-0 top-0 z-[95] will-change-transform"
      style={{ height: `${SPAN}vh`, background: curtainBackground(), transform: at(100), visibility: "hidden" }}
    />
  );
}
