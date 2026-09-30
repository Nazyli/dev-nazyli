"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { skills } from "@/data/skills";
import { getSkillIdFromHash } from "@/lib/skillNavigation";
import { SkillPlanet } from "@/components/ui/SkillPlanet";
import { DataPlate, DataRow } from "@/components/ui/DataPlate";
import { SectionHeading } from "@/components/ui/SectionHeading";

const TICKS = [0, 90, 180, 270];

export function Expertise() {
  const root = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState("");
  const selectSkill = useCallback((skillId: string | null) => {
    setActiveId(skillId);
    setShareStatus("");
  }, []);

  useEffect(() => {
    const activateSkillFromHash = () => {
      const skillId = getSkillIdFromHash(window.location.hash);
      if (!skillId) return;

      selectSkill(skillId);
      document.getElementById(`skill-${skillId}`)?.focus({ preventScroll: true });
    };

    if (getSkillIdFromHash(window.location.hash) !== null) {
      requestAnimationFrame(activateSkillFromHash);
    }
    window.addEventListener("hashchange", activateSkillFromHash);
    window.addEventListener("popstate", activateSkillFromHash);
    return () => {
      window.removeEventListener("hashchange", activateSkillFromHash);
      window.removeEventListener("popstate", activateSkillFromHash);
    };
  }, [selectSkill]);

  const active = skills.find((skill) => skill.id === activeId) ?? null;

  const shareActiveSkill = async () => {
    if (!active) return;

    const url = new URL(window.location.href);
    url.hash = `skill-${active.id}`;
    const link = url.toString();

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${active.name} expertise`,
          text: `Explore ${active.class}: ${active.tech.join(", ")}.`,
          url: link,
        });
        setShareStatus(`Skill link shared for ${active.name}.`);
        return;
      }

      await navigator.clipboard.writeText(link);
      setShareStatus(`Skill link copied for ${active.name}.`);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      try {
        await navigator.clipboard.writeText(link);
        setShareStatus(`Skill link copied for ${active.name}.`);
      } catch {
        setShareStatus("Sharing unavailable. Skill URL is in the address bar.");
      }
    }
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".expertise-reveal", {
          y: 24,
          opacity: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 75%",
          },
        });
      });
    },
    { scope: root }
  );

  const radiusRatios = [...new Set(skills.map((skill) => skill.radiusRatio))];

  return (
    <section
      id="s-expertise"
      ref={root}
      aria-label="Expertise"
      className="relative flex min-h-screen min-h-svh flex-col items-center justify-center px-6 py-12"
    >
      <div className="mb-6 flex flex-col items-center text-center sm:mb-8">
        <SectionHeading
          index="03"
          label="Expertise"
          descriptor="Star system catalog"
          align="center"
          className="expertise-reveal"
        />
        <h2 className="expertise-reveal mt-4 font-display text-3xl font-medium tracking-tight text-starlight sm:text-4xl">
          A system of skills.
        </h2>
      </div>

      <div
        className="expertise-solar-system expertise-reveal relative aspect-square w-[var(--solar)]"
        data-skill-system
        style={{
          "--solar": "min(88vw, 620px, max(16rem, calc(100svh - 17rem)))",
        } as CSSProperties}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
        >
          <circle
            cx="50"
            cy="50"
            r="49"
            className="fill-none stroke-starlight/15"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
          {radiusRatios.map((ratio) => (
            <g key={ratio}>
              <circle
                cx="50"
                cy="50"
                r={ratio * 50}
                className="fill-none stroke-starlight/25"
                strokeWidth="0.7"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="50"
                cy="50"
                r={ratio * 50}
                className="fill-none stroke-starlight/50"
                strokeWidth="1"
                strokeDasharray="0.8 2.4"
                vectorEffect="non-scaling-stroke"
              />
              {TICKS.map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const r = ratio * 50;
                return (
                  <line
                    key={angle}
                    x1={50 + Math.cos(rad) * r}
                    y1={50 + Math.sin(rad) * r}
                    x2={50 + Math.cos(rad) * (r + 1.6)}
                    y2={50 + Math.sin(rad) * (r + 1.6)}
                    className="stroke-starlight/55"
                    strokeWidth="0.8"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div
            className={`flex items-center justify-center transition-opacity duration-300 ${
              active ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="text-center">
              <p className="font-mono text-[8px] uppercase tracking-[0.25em] text-starlight/60">
                Core focus
              </p>
              <p className="mt-2 font-display text-lg font-medium tracking-tight text-starlight">
                AI ENGINEERING
              </p>
            </div>
          </div>
          <div
            className={`absolute flex items-center justify-center transition-opacity duration-300 ${
              active ? "opacity-100" : "opacity-0"
            }`}
          >
            {active && (
              <DataPlate
                title="Object readout"
                className="w-[min(76vw,340px)] border-starlight/40 bg-abyss/95 backdrop-blur-md"
              >
                <DataRow k="Object" v={active.name} />
                <DataRow k="Class" v={active.class} />
                <DataRow
                  k="Stack"
                  v={
                    <span className="flex flex-wrap justify-end gap-1.5">
                      {active.tech.map((tech) => (
                        <span
                          key={tech}
                          className="border border-indigo/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-starlight/80"
                        >
                          {tech}
                        </span>
                      ))}
                    </span>
                  }
                />
              </DataPlate>
            )}
          </div>
        </div>

        {skills.map((skill) => (
          <SkillPlanet
            key={skill.id}
            skill={skill}
            isActive={activeId === skill.id}
            isOrbitPaused={activeId !== null}
            onActivate={() => selectSkill(skill.id)}
            onDeactivate={() => selectSkill(null)}
          />
        ))}
      </div>

      <ul className="print-skills" aria-label="All expertise and technologies">
        {skills.map((skill) => (
          <li key={skill.id}>
            <strong>{skill.name}</strong>
            <span>{skill.tech.join(" · ")}</span>
          </li>
        ))}
      </ul>

      <p id="skill-navigation-help" className="sr-only">
        Use the arrow keys to move between planets. Press Enter or Space to select one.
      </p>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p
          aria-live="polite"
          className="pointer-events-none font-mono text-center text-[10px] uppercase tracking-[0.3em] text-starlight/75"
        >
          {active
            ? "Focus held · select another planet to explore"
            : "Select a planet to view its details"}
        </p>
        {active && (
          <button
            type="button"
            onClick={shareActiveSkill}
            aria-label={`Share ${active.name} expertise link`}
            className="inline-flex min-h-11 items-center border border-accent/45 px-3 font-mono text-[9px] uppercase tracking-[0.16em] text-accent transition-colors hover:bg-accent/10 focus-visible:bg-accent/10 motion-reduce:transition-none"
          >
            Share skill link
          </button>
        )}
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {shareStatus}
        </p>
      </div>
    </section>
  );
}
