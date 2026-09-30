"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { scrollController } from "@/lib/scrollController";
import { universeState } from "@/lib/universeState";

const SECTIONS = [
  { id: "s-hero", index: "01", label: "Deep Field", target: "TGT 01 · DEEP FIELD" },
  { id: "s-about", index: "02", label: "Observer", target: "TGT 02 · OBSERVER" },
  { id: "s-expertise", index: "03", label: "Star System", target: "TGT 03 · STAR SYSTEM" },
  { id: "s-projects", index: "04", label: "Projects", target: "TGT 04 · PROJECTS" },
  { id: "s-certificates", index: "05", label: "Certificates", target: "TGT 05 · CERTIFICATES" },
  { id: "s-experience", index: "06", label: "Mission Log", target: "TGT 06 · MISSION LOG" },
  { id: "s-contact", index: "07", label: "Downlink", target: "TGT 07 · DOWNLINK" },
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
        if (best >= 0) setActive(best);
      },
      { rootMargin: "-42% 0px -42% 0px" }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const goTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    if (!scrollController.lenis) {
      target.scrollIntoView({ behavior: "auto" });
      return;
    }

    scrollController.lenis.scrollTo(target, {
      offset: 0,
      duration: universeState.reducedMotion ? 0 : 1.4,
    });
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-9 items-center justify-between border-b border-indigo/25 bg-void/85 px-4 font-mono text-[10px] uppercase tracking-[0.25em] sm:px-6">
        <a
          href="#s-hero"
          onClick={(event) => {
            event.preventDefault();
            goTo("s-hero");
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
            onClick={() => goTo(section.id)}
            aria-current={active === i ? "true" : undefined}
            aria-label={section.label}
            className={`group relative flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] transition-colors duration-200 ${
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
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-indigo/30 bg-void/95 px-2 py-2 lg:hidden"
      >
        {SECTIONS.map((section, i) => (
          <button
            key={section.id}
            type="button"
            onClick={() => goTo(section.id)}
            aria-current={active === i ? "true" : undefined}
            aria-label={section.label}
            className={`flex min-h-10 flex-col items-center justify-center gap-1 font-mono transition-colors focus-visible:text-accent ${
              active === i ? "text-gold" : "text-starlight/50"
            }`}
          >
            <span className="text-[9px] tracking-[0.15em]">{section.index}</span>
            <span className="text-[7px] uppercase tracking-[0.08em]">
              {section.label === "Deep Field"
                ? "Deep"
                : section.label === "Star System"
                  ? "Skills"
                  : section.label === "Certificates"
                    ? "Certs"
                    : section.label === "Mission Log"
                      ? "Exp"
                      : section.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
