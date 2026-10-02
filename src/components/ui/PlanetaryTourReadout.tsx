"use client";

import { useSyncExternalStore } from "react";
import {
  getPlanetaryTourReadout,
  PLANETARY_FOCUS_COUNT,
  subscribeToPlanetaryTourReadout,
} from "@/lib/planetaryTour";

export function PlanetaryTourReadout() {
  const current = useSyncExternalStore(
    subscribeToPlanetaryTourReadout,
    getPlanetaryTourReadout,
    () => null,
  );

  if (!current) return null;

  return (
    <aside
      aria-label="Current Solar System flyby"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-14 z-20 text-right font-mono uppercase sm:right-6"
    >
      <p className="text-[8px] tracking-[0.2em] text-gold/75">
        {current.index >= 0
          ? `CURRENT FLYBY · ${String(current.index + 1).padStart(2, "0")}/
        ${String(PLANETARY_FOCUS_COUNT).padStart(2, "0")}`
          : "ORIGIN · SOL"}
      </p>
      <p className="mt-1 text-xs tracking-[0.18em] text-starlight">
        {current.body}
      </p>
    </aside>
  );
}
