/**
 * After React Bits' Gradual Blur: a band along the top of the screen, under
 * the header, where the page blurs progressively — clear at its bottom edge,
 * strongest at the screen's top — so content scrolls out of view softly
 * behind the header instead of being cut by the screen's edge.
 *
 * A stack of backdrop-blur layers. Each one fades in over its own stretch of
 * the band (eased, overlapping the next) and then stays on all the way to the
 * top; since each blurs what the ones before it already blurred, the blur
 * builds up continuously toward the top, with no seam where one layer hands
 * over to the next (slices that fade out again left visible steps).
 *
 * Always on, over the whole page, footer included.
 */
const LAYERS = 8;
const BASE_BLUR = 0.3; // px, the first layer's blur
const GROWTH = 1.45; // each next layer's blur, relative to the one before (to ~4.1px)

const layer = (i: number) => {
  // Layer i fades in across [start, start + span] of the band's height,
  // measured up from its bottom edge, on eased stops.
  const span = 100 / (LAYERS - 1);
  const start = (i - 1) * span * 0.85;
  const p = (n: number) => `${Math.max(0, Math.min(100, n)).toFixed(2)}%`;
  const mask = `linear-gradient(to top, transparent ${p(start)}, rgb(0 0 0 / 0.25) ${p(start + span * 0.3)}, rgb(0 0 0 / 0.75) ${p(start + span * 0.7)}, #000 ${p(start + span)})`;
  const blur = `blur(${(BASE_BLUR * GROWTH ** i).toFixed(2)}px)`;
  return { maskImage: mask, WebkitMaskImage: mask, backdropFilter: blur, WebkitBackdropFilter: blur };
};

export default function GradualBlur() {
  return (
    <div aria-hidden className="gradual-blur pointer-events-none fixed inset-x-0 top-0 z-40 h-[72px] landscape-tablet:h-[96px]">
      {Array.from({ length: LAYERS }, (_, i) => (
        <div key={i} className="absolute inset-0" style={layer(i)} />
      ))}
    </div>
  );
}
