# Nazyli Universe

Personal portfolio for **Evry Nazyli** — AI Engineer.

A single-page, immersive **"journey through space"** experience: the visitor starts in deep space and scrolls through the universe — Hero → About (planet reveal) → Expertise (solar system) → Projects → Certificates → Experience (space timeline) → Contact (Earth).

## Stack

| Need | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| 3D | Three.js · React Three Fiber · Drei |
| Scroll animation | GSAP + ScrollTrigger · Lenis |
| Deploy | Vercel (planned) |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build
npm run start      # serve production build
```

The published-project and public-experience selectors can be checked with:

```bash
node --experimental-strip-types --test src/data/published-projects.test.mjs src/data/published-experience.test.mjs
```

## Concept

One fixed WebGL canvas renders the universe (star-map, planets, constellation backdrop, Earth) while all content lives in normal DOM on top. Scroll drives a camera that travels through space along a scripted path, with each section marking a waypoint in the journey.

**Design language — "Deep Space Observatory":** near-black navy base, muted indigo depth, a single cyan used functionally (links, active states), warm white + gold for celestial highlights. Space Grotesk for headings, Inter for body, JetBrains Mono for data/metadata. Astronomy is expressed through typography, spacing, fine star-map details, and orbital/grid lines — not gradient/glow decoration.

## Project structure

```
src/
├── app/            layout · page · globals.css (design tokens)
├── components/
│   ├── sections/   Hero · About · Expertise · Projects · Certificates · Experience · Contact
│   ├── space/      SpaceScene · SpaceCamera · Stars · Planet · Earth · ...
│   ├── ui/         Navigation · Cursor · SectionHeading · NavDots
│   └── providers/  ScrollProvider (Lenis + ScrollTrigger)
├── hooks/          useScrollAnimation (master scroll pipeline)
├── lib/            universeState · cameraPath
└── data/           projects · skills · experience (content)
```

## Content

Content lives in `src/data/*` and is typed. `src/data/projects.json` currently supplies three published project records; `published-projects.ts` filters out draft titles marked `[TODO]` and dummy descriptions. `certificate.json` powers the searchable Certificates archive, with provider and validity filters plus copyable credential citations. Experience records marked `20XX`, `Details withheld`, or `Confidential` are omitted from the public timeline, leaving the available AI Engineer role visible.

## Deploy

Ready for **Vercel** (zero config). The deploy decision is pending; see `AGENTS.md` for the phase checklist.
