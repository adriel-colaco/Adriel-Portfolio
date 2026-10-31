"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import ItalicI from "./ItalicI";
import { prefersReducedMotion } from "./parallaxTicker";
import { introStyle } from "./intro";
import SocialIcons from "./SocialIcons";
import BlurHoverLink from "./BlurHoverLink";
import { useEntrance } from "./Entrance";
import { useLiquidGlass } from "./LiquidGlass";
import { EMAIL, EMAIL_URL, WHATSAPP_URL } from "./contact";

// "Work" and "Contact" scroll the home to a section (scrollToSection): from
// another page they go to the home with the section's hash, and the home
// scrolls there once it's loaded.
type Section = "work" | "contact";
const LINKS: { label: string; href: string; section?: Section }[] = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/#work", section: "work" },
  { label: "Contact", href: "/#contact", section: "contact" },
];

/** Scrolls the home to a section: "work" brings the first row of cases (its
 *  "Recent work" label, on whichever canvas is showing) to just under the
 *  header; "contact" goes to the very end, where the footer has flooded in. */
function scrollToSection(section: Section, behavior: ScrollBehavior = "smooth") {
  let top = document.documentElement.scrollHeight;
  if (section === "work") {
    const anchor = Array.from(document.querySelectorAll<HTMLElement>('[data-anchor="work"]')).find(
      (n) => n.getClientRects().length > 0,
    );
    if (!anchor) return;
    // --header-bottom can be a calc() (scaled header): measure it on a probe.
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;height:var(--header-bottom)";
    document.body.appendChild(probe);
    const headerBottom = probe.offsetHeight;
    probe.remove();
    // Its layout position, not its rendered one: the label may still be
    // rising in (its entrance transform) when the home has just loaded.
    let y = 0;
    for (let n: HTMLElement | null = anchor; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
    top = y - headerBottom - 20;
  }
  window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : behavior });
}

// Contact details shown at the foot of the open menu (Figma 37:34).
const CONTACTS = [
  { label: "Whatsapp", value: "(51) 41 9 9952-3617", href: WHATSAPP_URL },
  { label: "E-mail", value: EMAIL, href: EMAIL_URL },
];

// The hamburger ↔ X morph runs in two beats on the interface's rhythm: the
// bars slide (translate, and their width) and turn (rotate), one after the
// other — slide then turn when opening, turn then slide when closing.
const MORPH_STEP = 0.15; // s, the second beat's head start
function barMotion(open: boolean): CSSProperties {
  return {
    transitionProperty: "width, translate, rotate",
    transitionDuration: "var(--dur-ui)",
    transitionTimingFunction: "var(--ease-ui)",
    transitionDelay: open ? `0s, 0s, ${MORPH_STEP}s` : `${MORPH_STEP}s, ${MORPH_STEP}s, 0s`,
  };
}

// The open menu's entrance on the "blur" profile (the home): one cascade in reading
// order — the links, the hairline, the two contacts, the socials — each piece
// a fixed step after the previous one, all in the same Blur Text move.
const MENU_START = 0.3; // s, as the panel is well on its way open
const MENU_STEP = 0.07; // s between pieces
const MENU_ORDER = ["link-0", "link-1", "link-2", "divider", "contact-0", "contact-1", "socials"] as const;
const menuDelay = (piece: (typeof MENU_ORDER)[number]) =>
  `${(MENU_START + MENU_ORDER.indexOf(piece) * MENU_STEP).toFixed(2)}s`;

/**
 * `entranceDelay` (seconds) overrides when the header drops in: by default it
 * joins the home's hero cascade (after the loading screen); inner pages, which
 * have no loading screen, pass 0.
 */
export default function Navbar({ entranceDelay }: { entranceDelay?: number } = {}) {
  const [open, setOpen] = useState(false);
  // On the "blur" entrance profile (the home) the links' hover is a Blur Text swap.
  const blur = useEntrance() === "blur";
  // …and its open menu enters as one Blur Text cascade (menuDelay).
  const enterMenu = blur && open;
  const [atFooter, setAtFooter] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The closed pill is liquid glass (LiquidGlass.tsx) where the browser can
  // render it, frosted glass elsewhere.
  const pillRef = useRef<HTMLDivElement>(null);
  // The lens only goes on once the pill has finished closing: while it's still
  // shrinking from the open panel its refraction map can't be drawn (too big,
  // and redrawn every frame), so it stays frosted glass until then.
  const [settled, setSettled] = useState(true);
  const glass = useLiquidGlass(pillRef, !open && settled);
  const pathname = usePathname();

  // A section link on the home scrolls there (once the menu has let go of the
  // page's scroll); elsewhere it navigates to the home with the hash.
  const onLink = (section?: Section) => (e: ReactMouseEvent) => {
    setOpen(false);
    if (!section || pathname !== "/") return;
    e.preventDefault();
    history.replaceState(null, "", `#${section}`);
    setTimeout(() => scrollToSection(section), 50);
  };

  // Arriving on the home with a section's hash (from another page's menu):
  // jump there once the page has laid out, then once more after the page
  // transition has settled, in case anything above it moved meanwhile.
  useEffect(() => {
    if (pathname !== "/") return;
    const section = window.location.hash.slice(1);
    if (section !== "work" && section !== "contact") return;
    const ids = [400, 1200].map((ms) => setTimeout(() => scrollToSection(section, "auto"), ms));
    return () => ids.forEach(clearTimeout);
  }, [pathname]);
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Hide the header (slide it back up) once the full-screen footer takes over
  // the viewport, and bring it back when scrolling away from it.
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setAtFooter(entry.isIntersecting);
      },
      // Hide only once the footer nearly fills the viewport — i.e. its top has
      // climbed close to the header — so the header lingers a little longer.
      { threshold: 0.85 },
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  // Stays put while the menu is open (it's a full-screen panel of its own).
  const hiddenAtFooter = atFooter && !open;

  // Magnetic icon: the toggle's inner icon drifts a little toward the cursor
  // while it hovers the button (within the same padded zone as the cursor
  // magnet), easing back to centre on leave. Disabled under reduced motion.
  useEffect(() => {
    const btn = buttonRef.current;
    const icon = iconRef.current;
    if (!btn || !icon || prefersReducedMotion()) return;

    const PAD = 12; // reacts slightly beyond the button edge, like the magnet
    const STRENGTH = 0.22; // fraction of the cursor offset the icon follows
    const MAX = 4.5; // px cap: a clear pull that still stays inside the button

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    const clamp = (v: number) => Math.max(-MAX, Math.min(MAX, v));
    const loop = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      icon.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      raf =
        Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1
          ? requestAnimationFrame(loop)
          : 0;
    };
    const tick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      const inside =
        e.clientX >= r.left - PAD &&
        e.clientX <= r.right + PAD &&
        e.clientY >= r.top - PAD &&
        e.clientY <= r.bottom + PAD;
      if (inside) {
        tx = clamp((e.clientX - (r.left + r.width / 2)) * STRENGTH);
        ty = clamp((e.clientY - (r.top + r.height / 2)) * STRENGTH);
      } else {
        tx = 0;
        ty = 0;
      }
      tick();
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Lock page scroll while the menu is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Click-away backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      {/* Its top offset + closed pill height are mirrored in --header-bottom
          (globals.css), which the desktop hero centres its heading against. */}
      <header
        style={{ transform: hiddenAtFooter ? "translateY(-160%)" : "translateY(0)" }}
        className="fixed inset-x-0 top-[10px] z-50 px-[20px] transition-transform duration-(--dur-ui) ease-(--ease-ui) motion-reduce:transition-none landscape-tablet:top-[calc(20px*var(--nav-zoom))] landscape-tablet:px-0"
      >
        {/* The load-in (part of the hero entrance, see intro.ts) drops down from
            the top edge, and lives on this inner wrapper so it never fights the
            header's footer-hide transform. */}
        <div
          className="rise rise-from-top flex justify-center"
          style={{ ...introStyle("nav"), ...(entranceDelay !== undefined && { animationDelay: `${entranceDelay}s` }) }}
        >
          {glass.filter}
          <div
            ref={pillRef}
            onTransitionEnd={(e) => e.target === e.currentTarget && setSettled(!open)}
            // Both ways on the entrance curve: opening unfolds over 1s; closing
            // a little quicker, starting just after the click. The contents
            // fade out even faster, so they're all but gone while the panel's
            // soft start has barely moved — nothing gets squeezed, and the
            // close still answers straight away.
            // Glass with no outline, closed and open alike (Figma 6:100, in
            // glass: `.glass-pill`) — no border at all, since the glass's
            // refraction map has to line up with its edge. Open, the panel is
            // too big for the lens (LiquidGlass.tsx), so it's the frosted
            // version of the same glass, its tint raised to 95% white
            // (`.glass-pill--open`) so the menu stands clear of the page. On desktop the closed pill
            // is 386×70, scaled with its contents by --nav-zoom. Portrait
            // tablets keep their 80px-tall, 45% pill (its minimum scaled down
            // by --nav-zoom).
            className={`glass-pill flex flex-col overflow-hidden rounded-[33px] transition-[width,height,background-color] landscape-tablet:rounded-[calc(35px*var(--nav-zoom))] portrait-tablet:rounded-[calc(40px*var(--nav-zoom))] ${
              open
                ? "glass-pill--open h-[calc(100dvh-20px)] w-full max-w-[650px] duration-[1s] ease-(--ease-enter) landscape-tablet:h-[calc(100dvh-40px*var(--nav-zoom))] landscape-tablet:w-[97.222%] landscape-tablet:max-w-none"
                : "h-[66px] w-full max-w-[650px] delay-[60ms] duration-(--dur-ui) ease-(--ease-enter) landscape-tablet:h-[calc(70px*var(--nav-zoom))] landscape-tablet:w-[calc(386px*var(--nav-zoom))] landscape-tablet:max-w-none portrait-tablet:h-[calc(80px*var(--nav-zoom))] portrait-tablet:w-[max(45.139%,calc(430px*var(--nav-zoom)))]"
            }`}
            style={glass.style}
          >
            {/* Top row: logo + toggle — zoomed with the pill on big screens
                (--nav-zoom, globals.css), so logo, switch and button keep
                their proportion to the page. */}
            <div className="flex shrink-0 items-center justify-between py-[11px] pl-[20px] pr-[10px] landscape-tablet:py-[10px] landscape-tablet:pl-[25px] landscape-tablet:pr-[10px] landscape-tablet:[zoom:var(--nav-zoom)] portrait-tablet:py-[15px] portrait-tablet:pr-[15px]">
              <Link href="/" className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/figma/nav-logo.svg"
                  alt="Adriel Colaço"
                  // A little smaller on phones (and smaller still on the
                  // narrowest), leaving room for the language switch beside it.
                  className="h-[31px] w-auto shrink-0 max-[369px]:h-[29px] landscape-tablet:h-[37px] portrait-tablet:h-11"
                />
              </Link>
              <div className="flex items-center gap-3 landscape-tablet:gap-[20px]">
                {/* Language switch (Figma 24:777): the current language in dark
                    grey, the other one light. Display-only until the PT version
                    exists. Smaller on mobile. Hidden for now (the PT version
                    doesn't exist yet); swap `hidden` back to `flex` to show it. */}
                <div className="hidden items-center gap-[3px] font-mono text-[12px] leading-[1.4] landscape-tablet:gap-[4px] landscape-tablet:text-[16px]">
                  <span aria-current="true" className="text-[#1e1e1e] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
                    EN
                  </span>
                  <span aria-hidden className="text-[#a7a7a7] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
                    |
                  </span>
                  <span lang="pt-BR" className="text-[#a7a7a7] [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
                    PT
                  </span>
                </div>
                <button
                  ref={buttonRef}
                  type="button"
                  aria-label={open ? "Close menu" : "Open menu"}
                  aria-expanded={open}
                  data-cursor-magnet
                  onClick={() => setOpen((v) => !v)}
                  // Blue in both states (Figma 37:29); on hover a black glow rises in.
                  className="nav-button group relative isolate flex h-[44px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink landscape-tablet:h-[50px] landscape-tablet:w-[81px]"
                >
                  {/* The hover: a soft black glow rising from the bottom, like the
                      hero CTA's blue one (globals.css). */}
                  <span aria-hidden className="nav-button-glow" />
                  <span
                    ref={iconRef}
                    className="relative flex items-center justify-center will-change-transform"
                  >
                    {/* Two bars that morph into the close X (Figma 37:29) and
                        back: opening, they slide together to the centre, then
                        turn ±45°; closing plays it backwards — they turn back
                        straight, then part. While closed, their widths ease
                        down on hover (33→25 top, 33→12 bottom). */}
                    <span className="flex h-4 w-[34px] flex-col items-center justify-center gap-[6px] landscape-tablet:h-5 landscape-tablet:w-[43px]">
                      <span
                        className={`nav-bar-top h-[2px] rounded-full bg-white ${
                          open ? "w-[23px] translate-y-[4px] rotate-45" : "w-[26px] group-hover:w-[25px] landscape-tablet:w-[33px]"
                        }`}
                        style={barMotion(open)}
                      />
                      <span
                        className={`nav-bar-bottom h-[2px] rounded-full bg-white ${
                          open ? "w-[23px] -translate-y-[4px] -rotate-45" : "w-[26px] group-hover:w-[12px] landscape-tablet:w-[33px]"
                        }`}
                        style={barMotion(open)}
                      />
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Menu content (Figma 37:26), stacked from the bottom: the links,
                a full-width hairline 50px below them, then the contact row. */}
            <div
              // Fades in as the panel opens; on close it's gone within the
              // panel's first moments of shrinking.
              className={`flex flex-1 flex-col justify-end transition-opacity ${
                open
                  ? "opacity-100 delay-200 duration-(--dur-hover) ease-(--ease-fade)"
                  : "pointer-events-none opacity-0 duration-[120ms] ease-(--ease-fade)"
              }`}
            >
              {/* (24px between links on phones, 32 on desktop: the same air relative
                  to each size. Phones set the whole open menu flush right.) */}
              {/* The links and the contacts row scale with big screens
                  (--menu-zoom, globals.css); the panel and the hairline
                  between them don't, so it still runs edge to edge. */}
              <nav className="flex flex-col items-end gap-6 px-6 pb-7 landscape-tablet:items-start landscape-tablet:gap-8 landscape-tablet:px-[50px] landscape-tablet:pb-[50px] landscape-tablet:[zoom:var(--menu-zoom)]">
                {LINKS.map((link, i) => (
                  // Mask: each link rises up from below, bottom item first.
                  // On the "blur" profile (the home) there's no mask: the links open
                  // the menu's cascade (menuDelay), top to bottom.
                  <span key={link.label} className={blur ? "block" : "block overflow-hidden py-[0.12em] -my-[0.12em]"}>
                    <span
                      className={
                        blur
                          ? `block ${open ? "menu-blur-in" : ""}`
                          : "block transition-transform duration-(--dur-ui) ease-(--ease-ui)"
                      }
                      style={
                        blur
                          ? { animationDelay: menuDelay(`link-${i}` as (typeof MENU_ORDER)[number]) }
                          : {
                              transform: open ? "translateY(0)" : "translateY(120%)",
                              transitionDelay: open
                                ? `${(0.2 + (LINKS.length - 1 - i) * 0.08).toFixed(2)}s`
                                : "0s",
                            }
                      }
                    >
                      {blur ? (
                        <BlurHoverLink
                          href={link.href}
                          label={link.label}
                          onClick={onLink(link.section)}
                          className="flex items-center font-serif text-[72px] leading-[0.95] landscape-tablet:text-[86px]"
                        />
                      ) : (
                        <Link
                          href={link.href}
                          onClick={onLink(link.section)}
                          className="group flex items-center font-serif text-[72px] leading-[0.95] text-ink transition-colors duration-(--dur-hover) ease-(--ease-fade) hover:text-[#1e1e1e] landscape-tablet:text-[86px]"
                        >
                          {/* Line grows in on hover and pushes the label right. */}
                          <span className="block h-[2px] w-0 shrink-0 rounded-full bg-ink transition-all duration-(--dur-ui) ease-(--ease-ui) group-hover:mr-5 group-hover:w-10 group-hover:bg-[#1e1e1e]" />
                          <span className="whitespace-nowrap">
                            <ItalicI>{link.label}</ItalicI>
                          </span>
                        </Link>
                      )}
                    </span>
                  </span>
                ))}
              </nav>

              <div
                aria-hidden
                className={`h-px w-full shrink-0 bg-line ${enterMenu ? "menu-blur-in" : ""}`}
                style={enterMenu ? { animationDelay: menuDelay("divider") } : undefined}
              />

              {/* Contacts (mono label over value) on the left, socials on the
                  right; values and icons turn blue on hover. Stacks on phones. */}
              <div className="flex flex-col items-end gap-8 px-6 py-5 landscape-tablet:flex-row landscape-tablet:items-end landscape-tablet:justify-between landscape-tablet:px-[50px] landscape-tablet:py-[32px] landscape-tablet:[zoom:var(--menu-zoom)]">
                <div className="flex flex-col items-end gap-6 font-mono text-[13px] leading-[1.4] sm:flex-row sm:gap-[48px] landscape-tablet:items-start landscape-tablet:text-[14px]">
                  {CONTACTS.map((c, i) => (
                    <div
                      key={c.label}
                      className={`flex flex-col items-end gap-2.5 text-right landscape-tablet:items-start landscape-tablet:gap-[10px] landscape-tablet:text-left ${enterMenu ? "menu-blur-in" : ""}`}
                      style={enterMenu ? { animationDelay: menuDelay(`contact-${i}` as (typeof MENU_ORDER)[number]) } : undefined}
                    >
                      <p className="whitespace-nowrap text-[11px] text-muted opacity-50 [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] landscape-tablet:text-[12px]">
                        {c.label}
                      </p>
                      <a
                        href={c.href}
                        {...(c.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="whitespace-nowrap text-[#1e1e1e] transition-colors duration-(--dur-hover) ease-(--ease-fade) hover:text-ink [text-box-edge:cap_alphabetic] [text-box-trim:trim-both]"
                      >
                        {c.value}
                      </a>
                    </div>
                  ))}
                </div>
                <div
                  className={enterMenu ? "menu-blur-in" : undefined}
                  style={enterMenu ? { animationDelay: menuDelay("socials") } : undefined}
                >
                  <SocialIcons className="[--icon-scale:0.8] landscape-tablet:[--icon-scale:1]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
