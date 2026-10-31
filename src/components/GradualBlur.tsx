/**
 * After React Bits' Gradual Blur: a band along the top of the screen, under
 * the header, where the page blurs progressively — clear at its bottom edge,
 * strongest at the screen's top — so content scrolls out of view softly
 * behind the header instead of being cut by the screen's edge. It's a stack of backdrop-blur layers, each twice as
 * strong as the one before, each masked to its own slice of the band (with
 * soft overlaps), so the blur ramps up smoothly.
 *
 * Always on, over the whole page, footer included.
 */
const LAYERS = 5;
const BASE_BLUR = 0.4; // px, the faintest layer's blur; each next layer doubles it (up to 6.4px)

const layer = (i: number) => {
  // Each layer is opaque over its slice of the band and fades in/out across
  // the neighbouring slices, so consecutive layers overlap.
  const step = 100 / LAYERS;
  const start = i * step;
  const p = (n: number) => `${Math.max(0, Math.min(100, n)).toFixed(2)}%`;
  const mask = `linear-gradient(to top, transparent ${p(start - step)}, #000 ${p(start)}, #000 ${p(start + step)}, transparent ${p(start + 2 * step)})`;
  const blur = `blur(${(BASE_BLUR * 2 ** i).toFixed(2)}px)`;
  return { maskImage: mask, WebkitMaskImage: mask, backdropFilter: blur, WebkitBackdropFilter: blur };
};

export default function GradualBlur() {
  return (
    <div aria-hidden className="gradual-blur pointer-events-none fixed inset-x-0 top-0 z-40 h-[48px] landscape-tablet:h-[64px]">
      {Array.from({ length: LAYERS }, (_, i) => (
        <div key={i} className="absolute inset-0" style={layer(i)} />
      ))}
    </div>
  );
}
