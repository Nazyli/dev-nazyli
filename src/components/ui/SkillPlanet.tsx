"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import type { Skill } from "@/data/skills";

type SkillPlanetProps = {
  skill: Skill;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
};

export function SkillPlanet({
  skill,
  isActive,
  onActivate,
  onDeactivate,
}: SkillPlanetProps) {
  const spinRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const spinTween = useRef<ReturnType<typeof gsap.to> | null>(null);
  const labelTween = useRef<ReturnType<typeof gsap.to> | null>(null);

  useEffect(() => {
    if (!spinRef.current || !labelRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const duration = 90 / skill.speed;
    const spin = gsap.to(spinRef.current, {
      rotation: skill.angleDeg + 360,
      duration,
      repeat: -1,
      ease: "none",
    });
    const label = gsap.to(labelRef.current, {
      rotation: -360,
      duration,
      repeat: -1,
      ease: "none",
    });
    spinTween.current = spin;
    labelTween.current = label;

    return () => {
      spin.kill();
      label.kill();
    };
  }, [skill]);

  useEffect(() => {
    const scale = isActive ? 0.12 : 1;
    spinTween.current?.timeScale(scale);
    labelTween.current?.timeScale(scale);
  }, [isActive]);

  return (
    <div
      ref={spinRef}
      className="absolute left-1/2 top-1/2 h-0 w-0"
      style={{ transform: `rotate(${skill.angleDeg}deg)` }}
    >
      <div
        className="absolute"
        style={{
          transform: `translateX(calc(var(--solar) * ${skill.radiusRatio * 0.5}))`,
        }}
      >
        <button
          type="button"
          aria-label={skill.name}
          aria-pressed={isActive}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") onActivate();
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") onDeactivate();
          }}
          onFocus={onActivate}
          onBlur={onDeactivate}
          onClick={() => {
            if (isActive) onDeactivate();
            else onActivate();
          }}
          className="group flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span
            className={`relative block h-3.5 w-3.5 transition-transform duration-300 group-focus-visible:scale-150 ${
              isActive ? "scale-150" : ""
            }`}
          >
            <span
              className={`planet planet-${skill.tone} planet-glow-${skill.tone} h-full w-full`}
            />
            {skill.ringed && (
              <span
                aria-hidden
                className={`planet-ring planet-ring-${skill.tone}`}
              />
            )}
          </span>
          <span
            ref={labelRef}
            className={`mt-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.15em] transition-colors duration-300 ${
              isActive ? "text-accent" : "text-starlight/80"
            }`}
          >
            {skill.name}
          </span>
        </button>
      </div>
    </div>
  );
}
