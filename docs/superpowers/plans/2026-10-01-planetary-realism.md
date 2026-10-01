# Planetary Realism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio’s planets read as naturally lit, distinct worlds instead of emissive patterned spheres.

**Architecture:** Keep procedural CanvasTexture generation and existing R3F components. Add surface palette tokens, correct the light balance, and let cloud layers respond to the same key light as planetary surfaces.

**Tech Stack:** Next.js 16, TypeScript, Three.js, React Three Fiber, Tailwind CSS v4 theme tokens.

**Spec:** `docs/superpowers/specs/2026-10-01-planetary-realism-design.md`

## Global Constraints

- Keep `src/app/globals.css` as the source of color tokens.
- Keep the existing procedural texture pipeline and avoid new dependencies.
- Preserve reduced-motion behavior and avoid per-frame allocations.
- Keep shadows disabled and the Canvas behind DOM content.
- Run `npm run lint` and `npm run build` before committing.

## Review Focus

- Planet shade may go too dark on narrow screens — inspect mobile Hero and Contact.
- New hues may appear oversaturated — inspect all six planet surfaces in daylight and shadow.
- Standard cloud materials may lose opacity — check Venus, Jupiter, and Uranus shells.
- Existing Earth may disappear without emission — verify Contact’s Earth remains recognizable.
- Reduced-motion mode must keep bodies visible and still — preserve current early-return paths.

---

### Task 1: Establish natural planetary lighting

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/lib/spaceColors.ts`
- Modify: `src/components/space/PlanetarySystem.tsx`
- Modify: `src/components/space/Earth.tsx`
- Modify: `src/components/space/SpaceScene.tsx`
- Modify: `src/components/space/AccretionDisk.tsx`

- [x] Add muted, named planetary surface tokens and use them for the six planet palettes.
- [x] Reduce ambient/cool fill and set one restrained warm key light.
- [x] Remove texture-mapped emission from new planets; tune Earth emission down to a faint floor.
- [x] Render cloud shells with a light-responsive diffuse material; reduce bump scales to subtle values.
- [x] Replace the bright black-hole center sprite with a dark event horizon and reduce the disk’s apparent dominance.
- [x] Inspect Hero, About, Expertise, Experience, and Contact at desktop and narrow mobile widths.
- [x] Run `npm run lint` and `npm run build`; fix any issues.
- [x] Review `git diff --check` and commit as `polish(space): ground planetary lighting and color`.
