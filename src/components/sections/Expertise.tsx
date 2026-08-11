"use client";

import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { skills } from "@/data/skills";
import { SkillPlanet } from "@/components/ui/SkillPlanet";

export function Expertise() {
  const root = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = skills.find((skill) => skill.id === activeId) ?? null;

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
      ref={root}
      aria-label="Expertise"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20"
    >
      <div className="mb-12 text-center">
        <p className="expertise-reveal font-mono text-xs uppercase tracking-[0.35em] text-gold">
          02 · Expertise
        </p>
        <h2 className="expertise-reveal mt-4 font-display text-3xl font-medium tracking-tight text-starlight sm:text-4xl">
          A system of skills.
        </h2>
      </div>

      <div
        className="expertise-reveal relative aspect-square w-[min(74vw,440px)]"
        style={{ "--solar": "min(74vw, 440px)" } as CSSProperties}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <circle
            cx="50"
            cy="50"
            r="49"
            className="fill-none"
            stroke="#f5efe0"
            strokeOpacity="0.06"
            strokeWidth="0.6"
            vectorEffect="non-scaling-stroke"
          />
          {radiusRatios.map((ratio) => (
            <g key={ratio}>
              <circle
                cx="50"
                cy="50"
                r={ratio * 50}
                className="fill-none"
                stroke="#1e213f"
                strokeOpacity="0.5"
                strokeWidth="0.7"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx="50"
                cy="50"
                r={ratio * 50}
                className="fill-none"
                stroke="#1e213f"
                strokeOpacity="0.7"
                strokeWidth="1"
                strokeDasharray="0.6 2.6"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-indigo">
            Core focus
          </p>
          <p className="mt-2 font-display text-lg font-medium tracking-tight text-starlight">
            AI ENGINEERING
          </p>
        </div>

        {skills.map((skill) => (
          <SkillPlanet
            key={skill.id}
            skill={skill}
            isActive={activeId === skill.id}
            onActivate={() => setActiveId(skill.id)}
            onDeactivate={() => setActiveId(null)}
          />
        ))}
      </div>

      <div className="relative mt-12 h-24 w-full max-w-md">
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            active ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-indigo">
            Hover a planet
          </p>
        </div>
        <div
          className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center transition-opacity duration-300 ${
            active ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">
            {active?.name}
          </p>
          <p className="mt-3 max-w-sm text-starlight/70">{active?.detail}</p>
        </div>
      </div>
    </section>
  );
}
