import Navbar from "@/components/Navbar";
import DesktopCanvas from "@/components/DesktopCanvas";
import MobileCanvas from "@/components/MobileCanvas";
import TabletCanvas from "@/components/TabletCanvas";
import FooterReveal from "@/components/FooterReveal";
import SiteLoader from "@/components/SiteLoader";
import { EntranceScope } from "@/components/Entrance";

/**
 * The home. Every entrance plays React Bits' Blur Text instead of the mask
 * rise, and the hero's changing word swaps letter by letter in the same move
 * instead of typing (the "blur" entrance profile: globals.css + Entrance.tsx).
 */
export default function Home() {
  return (
    <EntranceScope profile="blur">
      {/* Quick loading screen; lifts like a curtain, then the entrances play */}
      <SiteLoader />
      <Navbar />

      {/* Landscape tablets + desktop: pixel-exact 1440px Figma canvas, scaled proportionally */}
      <DesktopCanvas />

      {/* Portrait tablets: the desktop canvas on 2 columns (820px frame) */}
      <TabletCanvas />

      {/* Phones: pixel-exact 360px Figma mobile canvas, scaled proportionally */}
      <main className="landscape-tablet:hidden">
        <MobileCanvas />
      </main>

      {/* Fullscreen footer — floods in as a blue circle swelling out of the
          point where the hand-drawn line ends, once the line finishes drawing. */}
      <FooterReveal />
    </EntranceScope>
  );
}
