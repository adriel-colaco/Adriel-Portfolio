"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * The site's entrance profile: "rise" (the default — words and blocks rising
 * from their masks) or "blur" (the home — React Bits' Blur Text). Most of
 * the switch is CSS, scoped by `data-entrance` (globals.css); the context is
 * for the few pieces whose motion is driven by JS, like the hero's changing
 * word.
 */
export type EntranceProfile = "rise" | "blur";

const EntranceContext = createContext<EntranceProfile>("rise");

export const useEntrance = () => useContext(EntranceContext);

/** Switches a subtree to an entrance profile, for both its CSS and its JS. */
export function EntranceScope({ profile, children }: { profile: EntranceProfile; children: ReactNode }) {
  return (
    <EntranceContext value={profile}>
      <div data-entrance={profile}>{children}</div>
    </EntranceContext>
  );
}
