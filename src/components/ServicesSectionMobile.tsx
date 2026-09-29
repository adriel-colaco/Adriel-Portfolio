"use client";

import { useState } from "react";
import ItalicI from "./ItalicI";
import SplitText from "./SplitText";
import { LOGOS } from "./logos";

/**
 * Mobile "Serviços" section — the stacked counterpart of ServicesSection: a
 * client-logo marquee on top, the serif statement, then a full-width accordion
 * of services (opening one reveals a preview image + copy). Dimensions are in
 * `cqw` on the 360px mobile frame, matching MobileCanvas. The 1px separators are
 * a `bg-line` backdrop showing through `gap-px` / `p-px` seams.
 */
const FRAME = 360;
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

const LOGO_GAP = 40; // design px between logos in the marquee (mobile)
const MOBILE_LOGO_H = 34; // design px

function ToggleIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
      className="block shrink-0"
      style={{ width: u(24), height: u(24) }}
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

const EASE = "cubic-bezier(0.33,1,0.68,1)";
const DUR = "0.5s";

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
      className="flex w-full flex-col bg-canvas text-left"
      style={{ padding: u(20), gap: open ? u(16) : "0px", transition: `gap ${DUR} ${EASE}` }}
    >
      <div className="flex w-full items-center justify-between" style={{ gap: u(16) }}>
        <span className="font-serif leading-none text-ink" style={{ fontSize: u(24) }}>
          <ItalicI>{service.title}</ItalicI>
        </span>
        <ToggleIcon open={open} />
      </div>

      {/* Smooth height via the grid-rows 0fr→1fr trick. */}
      <div
        className="grid w-full"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", transition: `grid-template-rows ${DUR} ${EASE}` }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col" style={{ gap: u(16) }}>
            <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={service.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <p
              className="font-mono text-muted"
              style={{ fontSize: u(14), lineHeight: 1.4 }}
            >
              {open && (
                <SplitText text={LOREM} stagger={0.014} duration={0.6} startDelay={0.15} />
              )}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function ServicesSectionMobile() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="bg-line" style={{ width: u(340), marginInline: "auto" }}>
      <div className="flex flex-col gap-px p-px">
        {/* Client-logo marquee */}
        <div className="relative overflow-hidden bg-canvas" style={{ height: u(72) }}>
          <div className="absolute inset-0 flex items-center">
            <div className="animate-marquee flex shrink-0 items-center">
              {[...LOGOS, ...LOGOS].map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${src}-${i}`}
                  src={`/figma/${src}.svg`}
                  alt=""
                  className="block w-auto shrink-0"
                  style={{ height: u(MOBILE_LOGO_H), marginRight: u(LOGO_GAP) }}
                />
              ))}
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-canvas to-transparent"
            style={{ width: u(48) }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-gradient-to-l from-canvas to-transparent"
            style={{ width: u(48) }}
          />
        </div>

        {/* Statement */}
        <div className="bg-canvas" style={{ padding: u(20) }}>
          <h2 className="font-serif text-ink" style={{ fontSize: u(30), lineHeight: 1.1 }}>
            <ItalicI>
              Uma visão multidisciplinar que une estratégia, design e tecnologia
            </ItalicI>
          </h2>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-px">
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
  );
}
