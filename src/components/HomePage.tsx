import Navbar from "@/components/Navbar";
import GradualBlur from "@/components/GradualBlur";
import DesktopCanvas from "@/components/DesktopCanvas";
import MobileCanvas from "@/components/MobileCanvas";
import TabletCanvas from "@/components/TabletCanvas";
import FooterReveal from "@/components/FooterReveal";
import SiteLoader from "@/components/SiteLoader";
import { EntranceScope } from "@/components/Entrance";
import type { HomeVariant } from "@/components/homeVariants";

/**
 * The home. Every entrance plays React Bits' Blur Text instead of the mask
 * rise, and the hero's changing word swaps letter by letter in the same move
 * instead of typing (the "blur" entrance profile: globals.css + Entrance.tsx).
 * `variant` picks v1 or v2 (homeVariants.ts).
 */
export default function HomePage({ variant }: { variant: HomeVariant }) {
  return (
    <EntranceScope profile="blur">
      {/* Quick loading screen; lifts like a curtain, then the entrances play */}
      <SiteLoader />
      <Navbar />
      {/* The page blurs out softly under the header */}
      <GradualBlur />

      {/* Landscape tablets + desktop: pixel-exact 1440px Figma canvas, scaled proportionally */}
      <DesktopCanvas variant={variant} />

      {/* Portrait tablets: the desktop canvas on 2 columns (820px frame) */}
      <TabletCanvas variant={variant} />

      {/* Phones: pixel-exact 360px Figma mobile canvas, scaled proportionally */}
      <main className="landscape-tablet:hidden">
        <MobileCanvas variant={variant} />
      </main>

      {/* Fullscreen footer — floods in as a blue circle swelling out of the
          point where the hand-drawn line ends, once the line finishes drawing. */}
      <FooterReveal />
    </EntranceScope>
  );
}
