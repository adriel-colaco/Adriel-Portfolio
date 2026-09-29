import ScrollQuote from "./ScrollQuote";
import ScrollLine, { MOBILE_LINE } from "./ScrollLine";
import PortraitReveal from "./PortraitReveal";
import Reveal from "./Reveal";
import { Curtain, CURTAIN_LEAD } from "./Curtain";

/**
 * Mobile "Linha" section (Figma 39:68) — the stacked counterpart of
 * LinhaSection: a bordered 340px box with the black-and-white portrait (wiped
 * in top→bottom), the quote (words rise in, then fill letter by letter on
 * scroll) and the hand-drawn line beneath it, drawn at its own mobile size.
 * `cqw` on the 360px mobile frame. `data-linha` scopes the line's
 * scroll-chaining to this section's own quote.
 *
 * The box opens as it scrolls in, as the site's boxes do (<Curtain>, like the
 * Capabilities cards above it): its top hairline fades in and a curtain opens
 * it from the top down. Its contents keep their own scroll-driven moves, each
 * set off as it comes into view itself — by which time the curtain has passed.
 */
const FRAME = 360;
const u = (px: number) => `${((px * 100) / FRAME).toFixed(4)}cqw`;

export default function LinhaSectionMobile() {
  return (
    <Reveal style={{ width: u(340), height: u(833), marginInline: "auto" }}>
      <Curtain at={CURTAIN_LEAD} lineAt={0} className="h-full w-full">
        <div data-linha className="relative h-full w-full border border-t-0 border-line bg-canvas">
          {/* Portrait, centred above the quote */}
          <PortraitReveal
            className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
            style={{ top: u(100), width: u(120), height: u(120) }}
          />

          <ScrollQuote
            text="I believe design is about turning complexity into clarity"
            className="absolute text-center font-serif"
            style={{ left: u(10), top: u(240), width: u(320), fontSize: u(36), lineHeight: 1 }}
          />

          {/* Hand-drawn line — draws start→end on scroll */}
          <ScrollLine
            line={MOBILE_LINE}
            className="line-enter absolute"
            style={{ left: u(10), top: u(368), width: u(320), height: u(463) }}
          />
        </div>
      </Curtain>
    </Reveal>
  );
}
