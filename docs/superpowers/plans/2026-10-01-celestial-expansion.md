# Celestial Scene Expansion Implementation Plan

> **For agentic workers:** This plan is being executed natively in the current session. Steps use checkbox syntax to track completion.

**Goal:** Add the six missing solar-system planets plus a sparse asteroid belt and a comet to the existing space journey.

**Architecture:** A focused scene component owns the six added planets and their palette-specific seeded surface, relief, and cloud maps from `planetaryTextures.ts`. Separate scene components own the instanced asteroid belt and comet; `SpaceScene` only composes these with the existing scene.

**Tech Stack:** Next.js 16 App Router, TypeScript, Three.js 0.182, React Three Fiber 9.

**Spec:** `docs/superpowers/specs/2026-10-01-celestial-expansion-design.md`

## Global Constraints

- Keep the Deep Space Observatory palette and restrained visual density.
- Canvas remains decorative; portfolio content stays in the DOM.
- Do not add dependencies, downloaded assets, ad-hoc palette colors, or postprocessing.
- Use compact generated textures, low-poly spheres, and instancing.
- Respect reduced motion and the ambient-motion pause control.

## Review Focus

- At narrow viewports, planet placement should remain in or near the visible field without covering section copy.
- With reduced motion enabled, the current static fallback remains available and does not require Canvas animation.
- With WebGL unavailable or lost, the CSS star-map fallback remains available.
- When the document is hidden or ambient motion is paused, added objects must not keep animating.
- Generated texture and geometry resources must be disposed when their scene component unmounts.

---

### Task 1: Add six planetary landmarks

**Files:**
- Create: `src/components/space/PlanetarySystem.tsx`
- Modify: `src/components/space/SpaceScene.tsx`

**Interfaces:**
- Consumes existing theme colors through `getSpaceColor` and `universeState`.
- Produces a decorative R3F component rendering Mercury, Venus, Mars, Jupiter, Uranus, and Neptune as configured landmarks.

- [x] Build low-poly planetary meshes with distinct rocky, cloudy, banded, icy, and stormy surface styles.
- [x] Generate seeded color, relief, and cloud maps with visible crater and storm detail; dispose textures on unmount.
- [x] Place each planet at a separate camera-route milestone, compute edge offsets for the active viewport, and add a thin Uranian ring.
- [x] Make slow rotation respect reduced motion and `ambientMotionPaused`.
- [x] Add the component to `SpaceScene` while retaining the existing Saturn-like ringed planet and Earth.

### Task 2: Add background landmarks

**Files:**
- Create: `src/components/space/AsteroidBelt.tsx`
- Create: `src/components/space/Comet.tsx`
- Modify: `src/components/space/SpaceScene.tsx`

**Interfaces:**
- `AsteroidBelt` renders a single instanced mesh with deterministic positions and slow group rotation.
- `Comet` renders one small body and a short translucent tail using existing palette tokens.

- [x] Construct a sparse asteroid annulus with a single `InstancedMesh`, bounded geometry count, and seeded placement.
- [x] Construct a compact comet with a tapered, low-opacity tail and place it outside the main text focus.
- [x] Pause ambient motion under reduced motion and the existing pause control.
- [x] Compose both objects into `SpaceScene`.
- [x] Reduce asteroid size and density after observing the field crossing foreground copy.

### Task 3: Verify the integrated scene

**Files:**
- Review: all files listed above.

- [ ] Run `npm run lint` and `npm run build`.
- [ ] Inspect the full route at desktop and mobile sizes for planet visibility and text overlap.
- [ ] Check reduced-motion and WebGL fallback paths remain intact.
- [ ] Commit the completed feature with a conventional message.
