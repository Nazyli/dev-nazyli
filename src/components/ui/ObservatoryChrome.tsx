"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  handleHashLinkClick,
  handleSectionLinkClick,
  navigateToSection,
} from "@/lib/sectionNavigation";
import { getProjectIndexFromHash } from "@/lib/projectNavigation";
import { getCertificateIndexFromHash } from "@/lib/certificateNavigation";
import { getSkillIdFromHash, navigateToSkill } from "@/lib/skillNavigation";
import { setAmbientMotionPaused } from "@/lib/universeState";
import { useAmbientMotionPaused } from "@/hooks/useAmbientMotionPaused";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { SurveyNavigator } from "@/components/ui/SurveyNavigator";

const SECTIONS = [
  { id: "s-hero", index: "01", label: "Deep Field", mobile: "Deep", compact: "Deep", target: "TGT 01 · DEEP FIELD" },
  { id: "s-about", index: "02", label: "Observer", mobile: "About", compact: "About", target: "TGT 02 · OBSERVER" },
  { id: "s-expertise", index: "03", label: "Star System", mobile: "Skills", compact: "Skills", target: "TGT 03 · STAR SYSTEM" },
  { id: "s-projects", index: "04", label: "Projects", mobile: "Work", compact: "Work", target: "TGT 04 · PROJECTS" },
  { id: "s-certificates", index: "05", label: "Certificates", mobile: "Certs", compact: "Cert", target: "TGT 05 · CERTIFICATES" },
  { id: "s-experience", index: "06", label: "Mission Log", mobile: "Log", compact: "Log", target: "TGT 06 · MISSION LOG" },
  { id: "s-contact", index: "07", label: "Downlink", mobile: "Contact", compact: "Link", target: "TGT 07 · DOWNLINK" },
];
const MOBILE_SECTION_INDICES = [0, 2, 3, 6] as const;
const MORE_SECTION_INDICES = [1, 4, 5] as const;

let clockValue: string | null = null;
const clockListeners = new Set<() => void>();
let clockInterval: ReturnType<typeof setInterval> | null = null;

function updateClock() {
  clockValue =
    new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(11, 19) + " WIB";
  clockListeners.forEach((listener) => listener());
}

function syncClock() {
  if (document.visibilityState === "hidden" || clockListeners.size === 0) {
    if (clockInterval !== null) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
    return;
  }

  if (clockInterval !== null) return;

  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

function subscribeClock(callback: () => void) {
  clockListeners.add(callback);
  if (clockListeners.size === 1) {
    document.addEventListener("visibilitychange", syncClock);
  }
  syncClock();

  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0) {
      document.removeEventListener("visibilitychange", syncClock);
      syncClock();
    }
  };
}

function getClockSnapshot() {
  return clockValue;
}

function getServerClockSnapshot() {
  return null;
}

function useJakartaClock() {
  return useSyncExternalStore(subscribeClock, getClockSnapshot, getServerClockSnapshot);
}

const JakartaClock = memo(function JakartaClock() {
  const clock = useJakartaClock();

  return <p className="tabular-nums text-starlight/60">{clock ?? "--:--:-- WIB"}</p>;
});

export function ObservatoryChrome() {
  const [active, setActive] = useState(0);
  const ambientMotionPaused = useAmbientMotionPaused();
  const reducedMotion = useReducedMotion();
  const moreSectionActive = MORE_SECTION_INDICES.some((index) => index === active);
  const journeyProgress = useRef<HTMLDivElement>(null);
  const moreSections = useRef<HTMLDetailsElement>(null);
  const pendingInitialRoute = useRef<string | null>(null);
  const previousActive = useRef(active);

  useEffect(() => {
    const closeWhenOutside = (event: Event) => {
      const menu = moreSections.current;
      if (!menu?.open) return;
      if (event.target instanceof Node && menu.contains(event.target)) return;
      menu.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      const menu = moreSections.current;
      if (
        event.key !== "Escape" ||
        !menu?.open ||
        document.querySelector("dialog[open]")
      ) return;

      event.preventDefault();
      menu.open = false;
      menu.querySelector("summary")?.focus();
    };

    document.addEventListener("pointerdown", closeWhenOutside);
    document.addEventListener("focusin", closeWhenOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenOutside);
      document.removeEventListener("focusin", closeWhenOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (previousActive.current === active) return;
    previousActive.current = active;
    if (moreSections.current?.open) moreSections.current.open = false;
  }, [active]);

  useEffect(() => {
    const progress = journeyProgress.current;
    if (!progress) return;
    const sections = SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((element): element is HTMLElement => element !== null);
    if (sections.length === 0) return;

    let frame = 0;
    const updateNavigation = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const value =
          scrollableHeight > 0
            ? Math.max(
                0,
                Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100)),
              )
            : 0;
        progress.setAttribute("aria-valuenow", String(value));
        progress.setAttribute("aria-valuetext", `${value}% complete`);
        const fill = progress.firstElementChild;
        if (fill instanceof HTMLElement) fill.style.width = `${value}%`;
        const center = window.innerHeight / 2;
        let best = 0;
        let bestDistance = Number.POSITIVE_INFINITY;

        sections.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const distance =
            rect.top <= center && rect.bottom >= center
              ? 0
              : Math.min(Math.abs(rect.top - center), Math.abs(rect.bottom - center));
          if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
          }
        });

        const id = SECTIONS[best].id;
        if (pendingInitialRoute.current && id !== pendingInitialRoute.current) {
          return;
        }
        pendingInitialRoute.current = null;
        setActive((current) => (current === best ? current : best));

        const preserveProjectHash =
          id === "s-projects" && getProjectIndexFromHash(window.location.hash) >= 0;
        const preserveCertificateHash =
          id === "s-certificates" &&
          getCertificateIndexFromHash(window.location.hash) >= 0;
        const preserveSkillHash =
          id === "s-expertise" &&
          getSkillIdFromHash(window.location.hash) !== null;
        if (
          window.location.hash !== `#${id}` &&
          !preserveProjectHash &&
          !preserveCertificateHash &&
          !preserveSkillHash
        ) {
          window.history.replaceState(
            typeof window.history.state === "object" &&
              window.history.state !== null
              ? { ...window.history.state, section: id }
              : { section: id },
            "",
            `#${id}`,
          );
        }
      });
    };

    updateNavigation();
    window.addEventListener("scroll", updateNavigation, { passive: true });
    window.addEventListener("resize", updateNavigation);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateNavigation);
      window.removeEventListener("resize", updateNavigation);
    };
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const hash = window.location.hash;
      const skillId = getSkillIdFromHash(hash);
      if (skillId) {
        navigateToSkill(skillId, false);
        return;
      }
      if (
        getProjectIndexFromHash(hash) >= 0 ||
        getCertificateIndexFromHash(hash) >= 0
      ) return;

      const id = hash.slice(1);
      navigateToSection(
        SECTIONS.some((section) => section.id === id) ? id : "s-hero",
        false,
      );
    };

    const initialId = window.location.hash.slice(1);
    const initialIndex = SECTIONS.findIndex((section) => section.id === initialId);
    if (initialIndex >= 0) {
      pendingInitialRoute.current = initialId;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => navigateToSection(initialId, false));
      });
    } else if (getProjectIndexFromHash(initialId) >= 0) {
      pendingInitialRoute.current = "s-projects";
    } else if (getCertificateIndexFromHash(initialId) >= 0) {
      pendingInitialRoute.current = "s-certificates";
    } else if (getSkillIdFromHash(initialId)) {
      const skillId = getSkillIdFromHash(initialId);
      pendingInitialRoute.current = "s-expertise";
      if (skillId) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => navigateToSkill(skillId, false));
        });
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-11 items-center justify-between border-b border-indigo/25 bg-void/85 px-4 font-mono text-[10px] uppercase tracking-[0.25em] sm:px-6">
        <a
          href="#s-hero"
          onClick={(event) => handleSectionLinkClick(event, "s-hero")}
          className="flex items-center gap-2 text-starlight/85 transition-colors duration-200 hover:text-accent"
        >
          <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-gold" />
          <span className="hidden sm:inline">Nazyli · Deep-Sky Observatory</span>
          <span className="sm:hidden">Nazyli · Obs</span>
        </a>

        <p
          aria-hidden
          className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-starlight/70 md:block"
        >
          {SECTIONS[active].target}
        </p>

        <div className="flex items-center gap-2 sm:gap-4">
          <JakartaClock />
          <SurveyNavigator />
          {!reducedMotion && (
            <button
              type="button"
              aria-label="Ambient space motion"
              aria-pressed={ambientMotionPaused}
              title={
                ambientMotionPaused ? "Resume ambient motion" : "Pause ambient motion"
              }
              onClick={() => setAmbientMotionPaused(!ambientMotionPaused)}
              className="inline-flex min-h-11 items-center justify-center gap-2 border-l border-indigo/30 pl-3 text-starlight/70 transition-colors hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent motion-reduce:transition-none sm:pl-4"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
              >
                {ambientMotionPaused ? (
                  <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
                ) : (
                  <path d="M5 3.5h2v9H5zM9 3.5h2v9H9z" fill="currentColor" />
                )}
              </svg>
              <span className="hidden sm:inline">
                {ambientMotionPaused ? "Motion off" : "Motion on"}
              </span>
            </button>
          )}
        </div>
        <div
          ref={journeyProgress}
          role="progressbar"
          aria-label="Survey progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          aria-valuetext="0% complete"
          className="absolute inset-x-0 bottom-0 h-px bg-indigo/30"
        >
          <div className="h-full w-0 bg-accent transition-[width] duration-100 motion-reduce:transition-none" />
        </div>
      </header>

      <nav
        aria-label="Sections"
        className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-5 lg:flex"
      >
        {SECTIONS.map((section, i) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            onClick={(event) => handleSectionLinkClick(event, section.id)}
            aria-current={active === i ? "true" : undefined}
            aria-label={section.label}
            className={`group relative flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-accent ${
              active === i
                ? "text-gold"
                : "text-starlight/55 hover:text-starlight/75"
            }`}
          >
            <span
              aria-hidden
              className={`whitespace-nowrap pr-1 text-[9px] uppercase tracking-[0.3em] text-starlight/50 opacity-0 transition-opacity duration-200 motion-reduce:transition-none group-hover:opacity-100 ${
                active === i ? "opacity-100" : ""
              }`}
            >
              {section.label}
            </span>
            <span
              aria-hidden
              className={`h-px transition-all duration-300 motion-reduce:transition-none ${
                active === i ? "w-4 bg-gold" : "w-0 bg-gold group-hover:w-3"
              }`}
            />
            {section.index}
          </a>
        ))}
      </nav>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-indigo/30 bg-void/95 px-0 pt-2 pb-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-[375px]:gap-x-2 lg:hidden"
      >
        {MOBILE_SECTION_INDICES.map((i) => {
          const section = SECTIONS[i];

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(event) => handleSectionLinkClick(event, section.id)}
              aria-current={active === i ? "true" : undefined}
              aria-label={section.label}
              className={`flex min-h-11 flex-col items-center justify-center gap-1 font-mono transition-colors focus-visible:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active === i ? "text-gold" : "text-starlight/50"
              }`}
            >
              <span className="text-[9px] tracking-[0.15em]">{section.index}</span>
              <span className="text-[8px] uppercase tracking-[0.02em] min-[420px]:hidden">
                {section.compact}
              </span>
              <span className="hidden text-[8px] uppercase tracking-[0.08em] min-[420px]:inline min-[520px]:text-[9px]">
                {section.mobile}
              </span>
            </a>
          );
        })}
        <details ref={moreSections} className="relative min-w-0">
          <summary
            aria-label={
              moreSectionActive
                ? `More sections. ${SECTIONS[active].label} is current.`
                : "More sections"
            }
            className={`flex min-h-11 cursor-pointer list-none flex-col items-center justify-center gap-1 font-mono focus-visible:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden ${
              moreSectionActive
                ? "text-gold"
                : "text-starlight/50"
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3">
              <circle cx="3" cy="8" r="1" fill="currentColor" />
              <circle cx="8" cy="8" r="1" fill="currentColor" />
              <circle cx="13" cy="8" r="1" fill="currentColor" />
            </svg>
            <span className="text-[8px] uppercase tracking-[0.08em]">More</span>
          </summary>
          <div
            role="group"
            aria-label="Other sections"
            className="absolute bottom-full right-0 mb-2 w-56 border border-indigo/60 bg-abyss p-2 shadow-2xl"
          >
            {MORE_SECTION_INDICES.map((i) => {
              const section = SECTIONS[i];

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={active === i ? "true" : undefined}
                  onClick={(event) =>
                    handleHashLinkClick(event, () => {
                      if (moreSections.current) moreSections.current.open = false;
                      navigateToSection(section.id);
                    })
                  }
                  className={`flex min-h-11 items-center justify-between gap-4 px-3 font-mono text-[10px] uppercase tracking-[0.15em] transition-colors hover:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    active === i ? "text-gold" : "text-starlight/70"
                  }`}
                >
                  <span>{section.label}</span>
                  <span className="text-[9px] text-starlight/45">{section.index}</span>
                </a>
              );
            })}
          </div>
        </details>
      </nav>
    </>
  );
}
