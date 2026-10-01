# Ordered Solar System Flyby Implementation Plan

**Goal:** Turn the existing scroll camera into a reversible flyby through the Solar System, focusing each major planet in orbital order.

**Architecture:** Keep the section-driven camera before Expertise and after Contact. Between those anchors, interpolate the camera through ordered planetary waypoints and point it at each world. Share orbit positions between camera and rendered bodies; keep DOM sections, navigation, and ambient-motion controls intact.

**Tech Stack:** Next.js 16, TypeScript, Three.js, React Three Fiber, existing GSAP scroll progress.

**Spec:** Approved direction in the current conversation.

## Global Constraints

- Preserve the existing dark observatory visual system and section content.
- Keep Three.js work in client components and avoid per-frame allocations.
- Respect reduced motion and ambient-motion pause behavior.
- Do not add dependencies or comments unless necessary.
- Run lint and production build before commit.

## Review Focus

- Camera position and look target must move through the same ordered stops in both scroll directions.
- Planet surfaces, rings, and the asteroid belt must agree with their orbit positions.
- Final Contact/Earth framing and the earlier portfolio journey must remain intact.

## Files and Responsibilities

- `src/lib/planetaryTour.ts`: ordered orbital body data, body positions, and camera pose interpolation.
- `src/components/space/SpaceCamera.tsx`: select the planetary tour pose inside the tour scroll range.
- `src/components/space/PlanetarySystem.tsx`: render the complete ordered set at the shared orbit positions with varied surface treatments and rings.
- `src/components/space/Earth.tsx`: keep the final Earth arrival within the responsive camera frame.
- `src/components/space/SpaceScene.tsx`: compose the flyby with the final Contact/Earth scene.
- `src/components/space/AsteroidBelt.tsx`: place the belt between Mars and Jupiter.
- `src/lib/planetaryTextures.ts`: provide terrestrial and solar surface maps from the existing deterministic texture generators.
- `src/components/ui/PlanetaryTourReadout.tsx`: announce the currently focused body and clear at section handoff.

## Tasks

- [x] Add deterministic Solar System orbit stops and matching camera/target curves bounded by Expertise and Contact.
- [x] Route the camera through the stops, preserving existing behavior outside the tour and for reduced motion.
- [x] Add Earth and Saturn, place all bodies in Mercury-to-Neptune order followed by dwarf planets, and align rings/moons/belt.
- [x] Inspect the live preview at the Expertise, Projects, Experience, and Contact anchors; fix visible discontinuities.
- [x] Run lint, build, `git diff --check`, and the Impeccable detector; commit the finished change.
