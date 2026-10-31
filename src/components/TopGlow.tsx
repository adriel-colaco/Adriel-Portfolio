/** The blue glow pooled at the top of the page, under the header (.top-glow,
 *  globals.css). `height` is a CSS length; it sits over the background grid
 *  and under everything else in its canvas. */
export default function TopGlow({ height }: { height: string }) {
  return <div aria-hidden className="top-glow pointer-events-none absolute inset-x-0 top-0" style={{ height }} />;
}
