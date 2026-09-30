"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { navigateToSection } from "@/lib/sectionNavigation";

const SECTIONS = [
  { id: "s-hero", index: "01", label: "Deep Field", mobile: "Deep", compact: "Deep", target: "TGT 01 · DEEP FIELD" },
  { id: "s-about", index: "02", label: "Observer", mobile: "About", compact: "About", target: "TGT 02 · OBSERVER" },
  { id: "s-expertise", index: "03", label: "Star System", mobile: "Skills", compact: "Skills", target: "TGT 03 · STAR SYSTEM" },
  { id: "s-projects", index: "04", label: "Projects", mobile: "Work", compact: "Work", target: "TGT 04 · PROJECTS" },
  { id: "s-certificates", index: "05", label: "Certificates", mobile: "Certs", compact: "Cert", target: "TGT 05 · CERTIFICATES" },
  { id: "s-experience", index: "06", label: "Mission Log", mobile: "Log", compact: "Log", target: "TGT 06 · MISSION LOG" },
  { id: "s-contact", index: "07", label: "Downlink", mobile: "Contact", compact: "Link", target: "TGT 07 · DOWNLINK" },
];

let clockValue: string | null = null;
let clockStarted = false;
const clockListeners = new Set<() => void>();

function subscribeClock(callback: () => void) {
  clockListeners.add(callback);
  if (!clockStarted) {
    clockStarted = true;
    const format = () =>
      new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(11, 19) +
      " WIB";
    clockValue = format();
    setInterval(() => {
      clockValue = format();
      clockListeners.forEach((listener) => listener());
    }, 1000);
  }
  return () => {
    clockListeners.delete(callback);
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

export function ObservatoryChrome() {
  const clock = useJakartaClock();
  const [active, setActive] = useState(0);
  const pendingInitialRoute = useRef<string | null>(null);
  const ratios = useRef<number[]>(SECTIONS.map(() => 0));

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = SECTIONS.findIndex((s) => s.id === entry.target.id);
          if (idx === -1) return;
          ratios.current[idx] = entry.isIntersecting
            ? entry.intersectionRatio
            : 0;
        });
        let best = -1;
        let bestRatio = 0;
        ratios.current.forEach((ratio, i) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = i;
          }
        });
        if (best >= 0) {
          const id = SECTIONS[best].id;
          if (pendingInitialRoute.current && id !== pendingInitialRoute.current) {
            return;
          }
          pendingInitialRoute.current = null;
          setActive(best);

          if (window.location.hash !== `#${id}`) {
            window.history.replaceState(
              typeof window.history.state === "object" &&
                window.history.state !== null
                ? { ...window.history.state, section: id }
                : { section: id },
              "",
              `#${id}`,
            );
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const id = window.location.hash.slice(1);
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
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-9 items-center justify-between border-b border-indigo/25 bg-void/85 px-4 font-mono text-[10px] uppercase tracking-[0.25em] sm:px-6">
        <a
          href="#s-hero"
          onClick={(event) => {
            event.preventDefault();
            navigateToSection("s-hero");
          }}
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

        <p className="tabular-nums text-starlight/60">{clock ?? "--:--:-- WIB"}</p>
      </header>

      <nav
        aria-label="Sections"
        className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-5 lg:flex"
      >
        {SECTIONS.map((section, i) => (
          <button
            key={section.id}
            type="button"
            onClick={() => navigateToSection(section.id)}
            aria-current={active === i ? "true" : undefined}
            aria-label={section.label}
            className={`group relative flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-accent ${
              active === i
                ? "text-gold"
                : "text-starlight/35 hover:text-starlight/75"
            }`}
          >
            <span
              aria-hidden
              className={`whitespace-nowrap pr-1 text-[9px] uppercase tracking-[0.3em] text-starlight/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${
                active === i ? "opacity-100" : ""
              }`}
            >
              {section.label}
            </span>
            <span
              aria-hidden
              className={`h-px transition-all duration-300 ${
                active === i ? "w-4 bg-gold" : "w-0 bg-gold group-hover:w-3"
              }`}
            />
            {section.index}
          </button>
        ))}
      </nav>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-indigo/30 bg-void/95 px-1 py-2 min-[375px]:gap-x-2 lg:hidden"
      >
        {SECTIONS.map((section, i) => (
          <button
            key={section.id}
            type="button"
            onClick={() => navigateToSection(section.id)}
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
          </button>
        ))}
      </nav>
    </>
  );
}
