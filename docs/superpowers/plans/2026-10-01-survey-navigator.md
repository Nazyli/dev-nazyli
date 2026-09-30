# Survey Navigator Implementation Plan

> **For agentic workers:** Execute inline in the current working branch; user authorized autonomous implementation.

**Goal:** Add a searchable, keyboard accessible dialog for navigating portfolio sections and published records.

**Architecture:** Build a focused client component that composes searchable items from existing data modules and navigation helpers. Match all query terms against titles and relevant record metadata. Mount its trigger in the observatory header; use native dialog links and existing hash navigation.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-10-01-survey-navigator-design.md`

## Global Constraints

- Use existing design tokens; do not add ad-hoc colors.
- Add no dependency and do not include placeholder data.
- Keep reduced-motion behavior and keyboard access intact.
- Run `rtk npm run lint` and `rtk npm run build` before commit.
- Do not add or run tests unless requested; verify the interaction in the browser.

## Review Focus

- Editable controls must keep `/` as text; verify through shortcut guard inspection.
- All four result categories must be included and searchable; verify source mapping and rendered results.
- Keyboard dismissal and focus restoration must work; verify native dialog wiring and manual browser use.
- Direct skill, project, and credential links must reach existing handlers; inspect hash formats and browser results.
- Re-selecting the active credential must reopen it; route through an explicit event when hashchange would not fire.
- Nested result scrolling must bypass Lenis interception and contain boundary overscroll.
- Small viewports must keep trigger and dialog usable; inspect responsive classes and browser rendering.

---

### Task 1: Survey Navigator

**Files:**
- Create: `src/components/ui/SurveyNavigator.tsx`
- Modify: `src/components/ui/ObservatoryChrome.tsx`

**Interfaces:**
- Consumes section, skill, project, and certificate records plus `navigateToSection`, `navigateToSkill`, and existing hash patterns.
- Produces an accessible header trigger and searchable native dialog.

- [x] Build item index from published data and all relevant project/credential metadata; section and skill items use current navigation helpers, project items activate the existing project index, and credential items dispatch into the archive navigation handler.
- [x] Add case-insensitive filtering, live result announcements, shortcut metadata, empty state, native open/close behavior, `/` and `Ctrl/Cmd+K`, arrow traversal, Enter activation, and Lenis-safe nested scrolling.
- [x] Mount the trigger in the observatory header; keep modal layout responsive and token based.
- [x] Run `rtk npm run lint` and `rtk npm run build`; inspect the rendered trigger in the browser and verify keyboard/hash paths against their handlers.
- [x] Commit as `feat(navigation): add survey navigator`.
