# Celestial Population Design

## Goal

Make the scroll journey feel like a populated, coherent universe by introducing natural satellites and a distant galaxy that appear where they make visual and astronomical sense.

## Visual direction

The site keeps its restrained Deep Space Observatory identity. New bodies use muted surface tones, physically shaded materials, seeded surface detail, and slow orbital motion. A small set of moons orbit selected host planets; the deep-sky galaxy remains distant and low contrast. Objects are staged along the camera route with open negative space around page copy.

## Architecture

- Natural satellites are children of their host planet groups, so they travel with the planet as camera stations change. Their local orbit groups animate slowly and stop for reduced motion or ambient pause.
- The four dwarf planets have distinct rocky/icy surfaces; Haumea has a visibly elongated body and Charon orbits Pluto.
- A dedicated deep-sky component owns one spiral galaxy made from a deterministic, low-density point cloud. It is positioned beside the route rather than behind headline copy.
- New geometry and texture resources are memoized and disposed with their owning component. No dependency or remote image assets are added.

## Acceptance

- The solar-system passage includes visible moons with distinct sizes, orbit radii, and muted rocky or icy surfaces.
- Ceres, Haumea, Pluto, Eris, and Charon extend the small-body population at several route stations.
- Moons remain attached to their host planets and move slowly without per-frame object allocation.
- A distant spiral galaxy is readable as a structured object at its route station without competing with text.
- Reduced-motion and ambient pause stop all new orbital animation.
- `npm run lint` and `npm run build` pass; desktop and mobile previews keep the route content legible.
