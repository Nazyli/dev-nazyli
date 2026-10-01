# Planetary Realism Design

## Goal

Make the solar bodies read as illuminated worlds with distinct atmospheres and geology, while retaining the restrained observatory art direction and keeping DOM copy clear.

## Current problems

- New planets use the same small astronomy-interface palette and are visibly self-lit through emissive maps.
- Ambient and fill lighting brighten most of each globe, weakening the day/night terminator.
- Cloud shells use unlit materials, so they stay uniformly bright across the night side.
- Several bump scales are large relative to their body radius, making terrain appear inflated.
- The black-hole centerpiece uses a bright star-like sprite for its center and an oversized additive disk that dominates nearby mobile copy.

## Design

Use one warm, distant key light and low cool fill. Remove texture-driven emission from the added planets and greatly reduce Earth's emission so the dark hemisphere stays dark without disappearing. Render cloud shells with a diffuse material that responds to the scene lights. Give each planet a muted, recognizable palette (basalt Mercury, cream clouded Venus, rust Mars, layered cream/russet Jupiter, pale cyan Uranus, deep blue Neptune) through named theme tokens. Reduce relief amplitude to a subtle surface cue; retain existing generated texture maps, planet placement, atmosphere, and route behavior.

Render the black-hole center as a compact dark event horizon inside a smaller, less overexposed accretion disk. Keep the existing textured plasma and slow spin, but remove the decorative bright core sprite.

Keep this procedural and dependency-free. Do not add shadows, environment maps, or per-frame allocations. The scene must preserve reduced-motion behavior and remain legible behind DOM content.

## Acceptance

- Day-side illumination and a visible but soft night-side terminator appear on all planets.
- Earth and new planets no longer look self-luminous; Earth’s map and cloud layer remain recognizable.
- Planet colors distinguish their identities without using the UI accent as a dominant surface color.
- Relief reads as planetary texture rather than large raised lumps.
- The black-hole core reads as a dark event horizon, and the disk no longer competes with mobile Hero copy.
- Desktop and narrow mobile previews retain clear section copy and no new layout shifts.
- `npm run lint` and `npm run build` pass.
