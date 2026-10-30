"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";

/*
 * Liquid glass, after liquid-glass-studio (github.com/iyinchao/liquid-glass-studio).
 * That project renders in WebGL over a fixed image; a header has to bend the
 * live page scrolling under it, so the same optics run here as an SVG filter
 * used as the element's backdrop-filter:
 *
 * - Refraction from the shape: within THICKNESS px of the edge, the backdrop
 *   is sampled from further in, along the edge's normal, by Snell's law for a
 *   rounded rim (its edge factor), so the page bends and magnifies along the
 *   border while the middle stays clear. The offsets are baked per pixel into
 *   a displacement map drawn from the pill's signed distance field.
 * - Dispersion: red, green and blue are displaced by slightly different
 *   amounts, splitting the bent edge into a thin rainbow.
 * - Blur: the backdrop is frosted first (edges extended, so the rim doesn't
 *   darken), then bent.
 * The rim light (fresnel) and the glare are CSS layers (`.glass-pill`).
 */
const THICKNESS = 20; // refraction band, px (studio default)
const IOR = 1.4; // refractive index (studio default)
const DISTANCE = 12; // max sampling offset at the very edge, px
const DISPERSION = [0.96, 1, 1.04]; // per-channel offset scale (R, G, B)
const BLUR = 4; // backdrop blur (standard deviation), px — a light frost, like the Figma glass
const SCALE = DISTANCE * 2 * DISPERSION[2]; // map range: ±SCALE/2 px covers every channel

/** How far the backdrop bends at `depth` px inside the edge (0 = on it). */
function edgeFactor(depth: number) {
  if (depth >= THICKNESS) return 0;
  const ratio = 1 - depth / THICKNESS;
  const thetaI = Math.asin(Math.min(1, ratio * ratio));
  const thetaT = Math.asin(Math.sin(thetaI) / IOR);
  return Math.tan(thetaI - thetaT);
}

/** Signed distance from (x, y) to a `w`×`h` rect with corner radius `r`,
 *  centred on the origin (negative inside). */
function sdRoundRect(x: number, y: number, w: number, h: number, r: number) {
  const qx = Math.abs(x) - w / 2 + r;
  const qy = Math.abs(y) - h / 2 + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/** The displacement map for a `w`×`h` pill with corner radius `r`: R and G
 *  hold the x/y sampling offset (0.5 = none), as a PNG data URL. */
function displacementMap(w: number, h: number, r: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(w, h);
  const sd = (x: number, y: number) => sdRoundRect(x - w / 2, y - h / 2, w, h, r);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const d = sd(px, py);
      let dx = 0;
      let dy = 0;
      const f = d < 0 ? edgeFactor(-d) : 0;
      if (f > 0) {
        // Outward normal from the distance field's gradient.
        const nx = sd(px + 0.5, py) - sd(px - 0.5, py);
        const ny = sd(px, py + 0.5) - sd(px, py - 0.5);
        const len = Math.hypot(nx, ny) || 1;
        // Sample from further in, against the normal.
        dx = (-nx / len) * f * DISTANCE;
        dy = (-ny / len) * f * DISTANCE;
      }
      const i = (y * w + x) * 4;
      img.data[i] = Math.round((0.5 + dx / SCALE) * 255);
      img.data[i + 1] = Math.round((0.5 + dy / SCALE) * 255);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

/** Whether this browser renders an SVG filter as a backdrop-filter (Chromium
 *  does; Safari and Firefox accept the syntax but draw nothing) — and is worth
 *  it: on touch devices (phones, tablets) the filter is too heavy for the GPU,
 *  so they get the frosted glass. */
function supportsSvgBackdrop() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return false;
  const ua = navigator.userAgent;
  if ((/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) || /Firefox/.test(ua)) return false;
  const probe = document.createElement("div");
  probe.style.backdropFilter = "url(#probe)";
  return probe.style.backdropFilter !== "";
}

// Each displaced copy keeps only its own channel; screened back together they
// rebuild the colour, the channels a pixel or two apart along the rim.
const CHANNELS = [
  { name: "r", matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" },
  { name: "g", matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" },
  { name: "b", matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" },
];

// Above this many pixels (e.g. mid-way through the menu opening) the map isn't
// redrawn — the glass is only on while the pill is small.
const MAX_AREA = 200_000;

/**
 * Liquid glass for the element in `ref`, while `on`: returns the SVG filter to
 * render next to it and the backdrop-filter style that applies it. `lens` is
 * false where the browser can't render it; the caller shows frosted glass
 * instead. The map is redrawn whenever the element changes size.
 */
export function useLiquidGlass(ref: RefObject<HTMLElement | null>, on: boolean) {
  const filterId = `liquid-glass-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const filterRef = useRef<SVGFilterElement>(null);
  const mapRef = useRef<SVGFEImageElement>(null);
  const [lens, setLens] = useState(false);

  useEffect(() => {
    // A one-off browser check, only possible on the client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLens(supportsSvgBackdrop());
  }, []);

  useEffect(() => {
    const el = ref.current;
    const map = mapRef.current;
    const filter = filterRef.current;
    if (!lens || !on || !el || !map || !filter) return;
    let size = "";
    const draw = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (!w || !h || w * h > MAX_AREA || `${w}x${h}` === size) return;
      size = `${w}x${h}`;
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, h / 2, w / 2);
      // Region and map in px: as a backdrop filter, percentages don't resolve
      // to the element's box, and a map that falls short of it leaves an edge
      // where every channel is pushed out of place (a coloured line).
      for (const node of [filter, map]) {
        node.setAttribute("x", "0");
        node.setAttribute("y", "0");
        node.setAttribute("width", String(w));
        node.setAttribute("height", String(h));
      }
      map.setAttribute("href", displacementMap(w, h, r));
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(el);
    return () => observer.disconnect();
  }, [lens, on, ref]);

  const filter = lens ? (
    <svg aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
      <filter ref={filterRef} id={filterId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feImage ref={mapRef} preserveAspectRatio="none" result="map" />
        <feGaussianBlur in="SourceGraphic" stdDeviation={BLUR} edgeMode="duplicate" result="bg" />
        {CHANNELS.map(({ name, matrix }, i) => (
          // Filter primitives must be direct children of <filter>.
          <Fragment key={name}>
            <feDisplacementMap
              in="bg"
              in2="map"
              scale={SCALE * DISPERSION[i]}
              xChannelSelector="R"
              yChannelSelector="G"
              result={`d${name}`}
            />
            <feColorMatrix in={`d${name}`} type="matrix" values={matrix} result={name} />
          </Fragment>
        ))}
        <feBlend in="r" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b" mode="screen" />
      </filter>
    </svg>
  ) : null;

  const style: CSSProperties | undefined =
    lens && on ? { backdropFilter: `url(#${filterId})`, WebkitBackdropFilter: `url(#${filterId})` } : undefined;

  return { lens, filter, style };
}
