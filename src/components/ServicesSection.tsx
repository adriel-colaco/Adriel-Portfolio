"use client";

import { useState } from "react";
import ItalicI from "./ItalicI";
import SplitText from "./SplitText";
import { LOGOS, LOGO_HEIGHT } from "./logos";

/**
 * "Serviços" section (Figma node 45:261) that sits flush under the line's box: a
 * large serif statement on the left and an accordion of services on the right,
 * with a client-logo marquee band underneath. Dimensions are expressed in `cqw`
 * (100cqw = the 1440px design frame) so it scales with the rest of the
 * DesktopCanvas, whose root establishes the inline-size container.
 *
 * The 1px separators come from a `bg-line` backdrop showing through `gap-px`
 * seams between opaque `bg-canvas` cells — so every stroke is a uniform hairline
 * instead of doubled cell borders.
 *
 * Services start collapsed; opening one reveals a preview image and copy. Only
 * one is open at a time. Copy is placeholder lorem ipsum for now.
 */
const FRAME = 1440;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

type Service = { title: string; image: string };

const SERVICES: Service[] = [
  { title: "UX/UI", image: "/projects/farol.jpg" },
  { title: "Identidade Visual", image: "/projects/hungara.jpg" },
  { title: "Direção de arte", image: "/projects/holly.jpg" },
  { title: "Ilustração", image: "/projects/trivium.jpg" },
];

const LOGO_GAP = 71.385; // design px between logos in the marquee

// Plus icon that collapses to a minus when the row is open (Figma service-arrow).
function ToggleIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className="block shrink-0"
      style={{ width: u(28), height: u(28) }}
    >
      <path
        d="M5.83398 14H22.1673"
        stroke="#001fff"
        strokeWidth={2.33333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {!open && (
        <path
          d="M14 5.83362V22.167"
          stroke="#001fff"
          strokeWidth={2.33333}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const EASE = "cubic-bezier(0.33,1,0.68,1)"; // easeOutCubic — smooth, gentle
const DUR = "0.6s";

function ServiceRow({
  service,
  open,
  onToggle,
}: {
  service: Service;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-start overflow-hidden bg-canvas text-left"
      style={{
        // Explicit height (112→240) on the SAME transition as the image, so the
        // whole card grows in exact lockstep with it — no min-height dead-zone
        // where the image starts before the card. Padding eases 40→20 so the
        // title glides between vertically-centred (closed) and top-aligned (open).
        height: open ? u(240) : u(112),
        paddingInline: u(20),
        paddingTop: open ? u(20) : u(40),
        paddingBottom: open ? u(20) : u(40),
        transition: `height ${DUR} ${EASE}, padding ${DUR} ${EASE}`,
      }}
    >
      {/* Preview image — the box opens (width shifts the title across, height
          drives the row) and masks the fixed-size image, so it's wiped into
          view instead of scaling. */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: open ? u(200) : "0px",
          height: open ? u(200) : "0px",
          marginRight: open ? u(20) : "0px",
          opacity: open ? 1 : 0,
          transition: `width ${DUR} ${EASE}, height ${DUR} ${EASE}, margin-right ${DUR} ${EASE}, opacity 0.3s ease-out`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={service.image}
          alt=""
          className="absolute left-0 top-0 max-w-none object-cover"
          style={{ width: u(200), height: u(200) }}
        />
      </div>

      {/* Right column: title row on top, copy pinned to the bottom (Figma) */}
      <div className="relative flex min-w-0 flex-1 flex-col self-stretch">
        <div
          className="flex w-full items-center justify-between"
          style={{ gap: u(20) }}
        >
          <span
            className="font-serif leading-none text-ink"
            style={{ fontSize: u(32) }}
          >
            <ItalicI>{service.title}</ItalicI>
          </span>
          <ToggleIcon open={open} />
        </div>

        {/* Copy — absolutely pinned to the bottom so it never affects the
            collapsed height; simply fades in (no mask) once the row has opened.
            Fixed width (659 inner − 200 image − 20 gap) keeps it from re-wrapping. */}
        {/* Description — pinned to its open-state spot via a fixed-height zone
            (= the open row height) so it never moves while the card grows. It
            reveals with the hero's word-by-word rise (SplitText), mounted on
            open so the animation plays each time the card expands. */}
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{ width: u(439), height: u(200) }}
        >
          <p
            className="absolute bottom-0 left-0 font-mono text-muted"
            style={{ fontSize: u(18), lineHeight: 1.4, width: u(439) }}
          >
            {open && (
              <SplitText
                text={LOREM}
                stagger={0.018}
                duration={0.6}
                startDelay={0.22}
              />
            )}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function ServicesSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    // bg-line backdrop; the p-px + gap-px seams reveal it as uniform hairlines.
    <div className="bg-line" style={{ width: u(1400), marginInline: "auto" }}>
      <div className="flex flex-col gap-px p-px">
        {/* Client-logo marquee — now sits on top of the section (Figma) */}
        <div
          className="relative overflow-hidden bg-canvas"
          style={{ height: u(160) }}
        >
          <div className="absolute inset-0 flex items-center">
            <div className="animate-marquee flex shrink-0 items-center">
              {[...LOGOS, ...LOGOS].map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${src}-${i}`}
                  src={`/figma/${src}.svg`}
                  alt=""
                  className="block w-auto shrink-0"
                  style={{ height: u(LOGO_HEIGHT), marginRight: u(LOGO_GAP) }}
                />
              ))}
            </div>
          </div>
          {/* Edge fades */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-canvas to-transparent"
            style={{ width: u(100) }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-gradient-to-l from-canvas to-transparent"
            style={{ width: u(100) }}
          />
        </div>

        {/* Statement (left) + accordion (right), each exactly half.
            Grid (minmax(0,1fr)) keeps the split at 50/50 regardless of content. */}
        <div className="grid grid-cols-2 items-stretch gap-px">
          <div
            className="flex items-start bg-canvas"
            style={{
              paddingLeft: u(20),
              paddingRight: u(150),
              paddingBlock: u(20),
            }}
          >
            <h2
              className="font-serif text-ink"
              style={{ fontSize: u(55), lineHeight: 1.1 }}
            >
              <ItalicI>
                Uma visão multidisciplinar que une estratégia, design e
                tecnologia
              </ItalicI>
            </h2>
          </div>

          <div className="flex min-w-0 flex-col gap-px">
            {SERVICES.map((service, i) => (
              <ServiceRow
                key={service.title}
                service={service}
                open={open === i}
                onToggle={() => setOpen((cur) => (cur === i ? null : i))}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
