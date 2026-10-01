# Celestial Population Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add natural satellites and a distant spiral galaxy to the camera journey with readable scale and restrained motion.

**Architecture:** Put named moon specs and local orbit groups beside their host planets in `PlanetarySystem`. Add one self-contained `DeepSkyGalaxy` component using seeded point geometry near the Projects passage. Both follow existing R3F cleanup and reduced-motion conventions.

**Tech Stack:** Next.js 16, TypeScript, Three.js, React Three Fiber, existing seeded random and color-token utilities.

**Spec:** `docs/superpowers/specs/2026-10-01-celestial-population-design.md`

## Global Constraints

- Keep the single fixed R3F Canvas and the existing camera path.
- Use existing color tokens and no external asset/dependency.
- Reuse seeded geometry, avoid per-frame allocations, and dispose component-owned resources.
- Stop orbital motion for reduced motion and ambient pause.
- Keep page content in the DOM and the Canvas pointer-events-none.

## Review Focus

- Planet resize/re-render: moon orbits must remain attached to the current host transform.
- Reduced motion or ambient pause: new orbital groups must remain still.
- Narrow viewport: galaxy must not compete with section text.
- Component unmount: any owned geometries/materials/textures must be disposed.

---

### Task 1: Natural satellite systems

**Files:**
- Modify: `src/components/space/PlanetarySystem.tsx`
- Modify: `src/components/space/Earth.tsx` only if a final Earth Moon improves the Contact passage without obscuring text.

**Interfaces:**
- Consume existing `PlanetSpec`, `PlanetSurfaceTextures`, `makePlanetSurfaceTextures`, `universeState`, and `SpaceColorToken`.
- Produce named satellite specs grouped under their host planet; each has radius, orbit radius, phase, and angular speed.

- [x] Add named moons to Jupiter, Uranus, and Neptune using understated rocky/icy palettes and scaled but visible radii.
- [x] Render the moons as child groups around their host planets with slow seeded phase and no allocation in `useFrame`.
- [x] Ensure motion pauses for reduced motion and ambient pause; dispose generated maps with the planet textures.
- [x] Inspect the Expertise, Projects, and later planet passages at narrow mobile width.
- [x] Run `npm run lint`, `npm run build`, and `git diff --check`.
- [x] Commit as `feat(space): add natural satellite systems`.

### Task 2: Distant spiral galaxy

**Files:**
- Create: `src/components/space/DeepSkyGalaxy.tsx`
- Modify: `src/components/space/SpaceScene.tsx`

**Interfaces:**
- Consume `createSeededRandom`, `universeState`, and existing color tokens.
- Export `DeepSkyGalaxy()` with internally owned, memoized point geometry.

- [ ] Generate a deterministic spiral distribution with a compact bulge, curved arms, and a subtle dust gap.
- [ ] Place it beside the Projects passage at low brightness; keep it away from section copy on narrow screens.
- [ ] Dispose geometry/material on unmount and pause any slow rotation for reduced motion/ambient pause.
- [x] Inspect Projects and Experience passages at narrow mobile width.
- [x] Run `npm run lint`, `npm run build`, and `git diff --check`.
- [ ] Commit as `feat(space): add a distant spiral galaxy`.
