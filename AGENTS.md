# AGENTS.md — Nazyli Universe

## Project

Single-page, immersive **"journey through space"** portfolio for **Evry Nazyli** — AI Engineer.

The visitor lands in deep space and scrolls through a journey:

```
Deep Space (Hero) → Planet Reveal (About) → Solar System (Expertise)
→ Constellations (Projects) → Space Timeline (Experience) → Earth (Contact)
```

Working directory: `D:\me-nazyli`. Not yet a git repo (git init happens in P0). Deploy target: Vercel (not yet decided).

## Stack (final — V1)

| Need | Tech | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | `transpilePackages: ['three']` |
| Styling | Tailwind CSS v4 | PostCSS plugin, CSS-first config via `@theme` |
| 3D | Three.js 0.18x + React Three Fiber 9 + Drei | one fixed Canvas as background |
| Scroll animation | GSAP 3.15 + ScrollTrigger + `@gsap/react` | **the only animation engine** |
| Smooth scroll | Lenis | optional; strengthens the "travel" feel |
| Deploy | Vercel | TBD |

**Deliberately excluded:** Framer Motion / Motion, zustand, backend, database, GSAP Club plugins (SplitText is paid — do NOT use; text reveal is done with manual per-line masks + stagger).

## Setup & Config

- `next.config.ts` → `transpilePackages: ['three']`
- `postcss.config.mjs` → `{ plugins: { "@tailwindcss/postcss": {} } }`
- `app/globals.css` → `@import "tailwindcss"` + `@theme` tokens (below)
- Fonts via `next/font/google` (self-hosted, zero layout shift) in `layout.tsx`: **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (mono).
- R3F `<Canvas>` is client-only → `next/dynamic(() => import('...'), { ssr: false })` + error boundary (WebGL fallback).
- Register once at app start: `gsap.registerPlugin(ScrollTrigger, useGSAP)`.

## Design System — "Deep Space Observatory"

Restrained astronomy. The theme comes from **typography, spacing, fine star-map details, and orbital/grid lines** — NOT gradients, glow, or excessive star decoration.

### Tokens (`@theme` in `globals.css`)

| Token | Value | Usage |
|---|---|---|
| `--color-void` | `#05060F` | page base (near-black navy) |
| `--color-abyss` | `#0B0C1A` | section / panel background |
| `--color-indigo` | `#1E213F` | depth, structural lines, muted elements |
| `--color-accent` | `#66D9E8` | **functional only**: links, active state, cursor reticle |
| `--color-starlight` | `#F5EFE0` | warm white: headings, primary text |
| `--color-gold` | `#D9B36A` | celestial highlights: stars, key nodes, timeline dots |

### Typography

- Headings: Space Grotesk, tight tracking, generous scale.
- Body: Inter.
- Data/metadata/labels: JetBrains Mono, uppercase, wide letter-spacing.
- Structural lines: 1px, opacity ≤ 0.3.

### Motion principles

- Slow, deliberate. Nothing aggressive.
- **Scroll = camera travelling through space** (single master scrub `0 → 1`).
- Mouse parallax is subtle. Cursor is a minimal reticle/crosshair in accent (functional), never a glow blob.
- Text reveal: GSAP line-mask / per-line stagger, manual splits.
- `prefers-reduced-motion` (via `gsap.matchMedia`): no scrub, no camera travel → static star-map, content simply visible. Also `window.WebGLRenderingContext` absence → static fallback.

## Architecture

### Scroll pipeline

```
Lenis (smooth scroll)
  → ScrollTrigger (registered once)
  → useScrollAnimation (one-time client init)
      → master timeline (scrub) writes { progress: 0→1 } to universeState
  → SpaceCamera reads universeState in useFrame
      → damp camera along CatmullRomCurve3 path + lookAt + mouse parallax
  → DOM sections react via their own ScrollTriggers
```

### Key files

- `src/hooks/useScrollAnimation.ts` — Lenis + ScrollTrigger sync, master scrub, scoped `gsap.context` with full cleanup.
- `src/lib/universeState.ts` — mutable singleton `{ progress, mouseX, mouseY, reducedMotion }`. GSAP writes, R3F reads in `useFrame`. **Not React state** (avoid re-render storms).
- `src/lib/cameraPath.ts` — `CatmullRomCurve3` keyframes matching the section journey (Hero → About → Expertise → Projects → Experience → Contact/Earth).
- `src/components/space/SpaceScene.tsx` — fixed full-screen `<Canvas>`, `dpr={[1, 1.75]}`, no shadows, low-poly. Contains Stars, celestial bodies, SpaceCamera. Sits behind all DOM (`z-0`).
- `src/components/space/SpaceCamera.tsx` — `useFrame`: damp along path, lookAt, mouse offset.
- `src/data/{projects,skills,experience}.ts` — typed content. Placeholders marked `[TODO]`.

### Space vs DOM responsibilities

| Layer | Owns |
|---|---|
| Canvas (Three/R3F) | star-map, planets, constellation backdrop, Earth, camera travel. Atmosphere only. |
| DOM (HTML + Tailwind) | **all content**: hero copy, about, solar-system skills, project slides, timeline, contact, navigation. Overlays the canvas. |

- **Expertise solar system is DOM/SVG**, not canvas: thin orbit rings + tick marks, sun = large heading, planets orbit via GSAP `timeScale`; hover/tap slows the orbit and reveals a detail panel.
- Canvas must stay `pointer-events: none` except where interaction is intentional.

### Section registry (scroll progress targets)

| Section | Progress | Celestial event |
|---|---|---|
| Hero | 0.00–0.15 | deep space, camera dolly forward through stars |
| About | 0.15–0.35 | planet reveal; camera approaches |
| Expertise | 0.35–0.55 | drift past solar system (DOM foreground) |
| Projects | 0.55–0.75 | constellation lines draw in backdrop |
| Experience | 0.75–0.90 | timeline line lights top→bottom |
| Contact | 0.90–1.00 | Earth from distance, slow rotate |

## Folder structure

```
src/
├── app/
│   ├── layout.tsx          # fonts, metadata, global bg, providers
│   ├── page.tsx            # server component composing sections
│   └── globals.css         # @import "tailwindcss" + @theme tokens
├── components/
│   ├── sections/           # Hero · About · Expertise · Projects · Experience · Contact
│   ├── space/              # SpaceScene · SpaceCamera · Stars · Planet · Orbit · Constellation · Earth · ShootingStar
│   ├── ui/                 # Navigation · Cursor(reticle) · SectionHeading · NavDots
│   └── providers/          # ScrollProvider (Lenis + ScrollTrigger init)
├── hooks/
│   └── useScrollAnimation.ts
├── lib/
│   ├── universeState.ts
│   └── cameraPath.ts
└── data/
    ├── projects.ts
    ├── skills.ts
    └── experience.ts
```

## Conventions

- Client boundary: any component using GSAP or R3F → `"use client"`. `page.tsx` stays a server component that composes client sections.
- CSS-first: tokens live in `@theme`; never invent ad-hoc hex colors in components; use utility classes for layout.
- No code comments unless necessary. No `console.log` leftovers.
- Naming: components `PascalCase.tsx`, files kebab-case. Content types exported from `src/data/*`.
- Placeholder content is marked `[TODO]` until real data arrives.
- Performance: dpr cap, no shadows, low-poly geometry, no per-frame allocation, no layout thrash.
- A11y: all content in DOM, skip-to-content link, `aria-label` on interactive planet/constellation elements, visible focus states, reduced-motion respected.

## Phases — each ends with a commit

1. **P0 Scaffold** — `create-next-app` (TS + Tailwind + ESLint), install deps (`three @react-three/fiber @react-three/drei gsap @gsap/react lenis`), `next.config` transpile, PostCSS, `@theme` tokens, fonts, `git init` + `.gitignore`. ✅ `npm run lint` + `npm run build`.
2. **P1 Core** — Lenis + ScrollTrigger + `universeState`, `SpaceScene` (Stars) fixed canvas, `SpaceCamera` path rig, hero entry. ✅ build + manual perf pass (DevTools).
3. **P2 Hero + About** — hero text reveal (manual GSAP), planet reveal + camera approach, section transition.
4. **P3 Expertise** — DOM/SVG solar system (rings, tick marks, orbit `timeScale` on hover/tap).
5. **P4 Projects** — pinned section, constellation SVG stroke-draw, 3 project slides.
6. **P5 Experience + Contact** — timeline scrub, Earth arrival, CTA overlay.
7. **P6 Polish** — subtle shooting star, responsive/mobile pass, a11y audit, SEO/meta/OG, deploy Vercel.

## Verification

- `npm run dev` + manual checklist per section (see section registry).
- `npm run lint` and `npm run build` MUST pass before every commit.
- Test reduced-motion (DevTools → Rendering → emulate `prefers-reduced-motion`) and WebGL-off fallback.
- Lighthouse (mobile): performance ≥ 90, accessibility ≥ 95.

## Commit policy

- One commit per phase at natural completion points; more granular commits when a change is meaningful.
- Conventional messages: `feat(space): starfield + camera rig`, `build: scaffold next app with tailwind v4`.
- Commit directly on the working branch. No force-push, no amend of shared history.
