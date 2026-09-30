"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { CSSProperties } from "react";
import { gsap } from "@/lib/gsap";
import { useAmbientMotionPaused } from "@/hooks/useAmbientMotionPaused";
import type { Skill } from "@/data/skills";

const ARROW_DIRECTIONS = {
  ArrowUp: [0, -1],
  ArrowRight: [1, 0],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
} as const;

function moveFocusAroundOrbit(event: KeyboardEvent<HTMLButtonElement>) {
  const direction = ARROW_DIRECTIONS[event.key as keyof typeof ARROW_DIRECTIONS];
  if (!direction) return;

  const system = event.currentTarget.closest("[data-skill-system]");
  if (!system) return;

  const planets = Array.from(
    system.querySelectorAll<HTMLButtonElement>("[data-skill-planet]"),
  );
  const current = event.currentTarget.getBoundingClientRect();
  const currentX = current.left + current.width / 2;
  const currentY = current.top + current.height / 2;
  const [directionX, directionY] = direction;
  const candidates = planets
    .filter((planet) => planet !== event.currentTarget)
    .map((planet) => {
      const rect = planet.getBoundingClientRect();
      const deltaX = rect.left + rect.width / 2 - currentX;
      const deltaY = rect.top + rect.height / 2 - currentY;
      const forward = deltaX * directionX + deltaY * directionY;
      const cross = Math.abs(deltaX * directionY - deltaY * directionX);

      return {
        planet,
        forward,
        angle: Math.atan2(cross, forward),
        distance: Math.hypot(deltaX, deltaY),
      };
    });

  const forwardCandidates = candidates.filter((candidate) => candidate.forward > 0);
  const target = forwardCandidates.length > 0
    ? forwardCandidates.sort(
        (a, b) => a.angle - b.angle || a.distance - b.distance,
      )[0]?.planet
    : candidates.sort((a, b) => a.forward - b.forward)[0]?.planet;

  if (!target) return;
  event.preventDefault();
  target.focus();
}

type SkillPlanetProps = {
  skill: Skill;
  isActive: boolean;
  isOrbitPaused: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
};

export function SkillPlanet({
  skill,
  isActive,
  isOrbitPaused,
  onActivate,
  onDeactivate,
}: SkillPlanetProps) {
  const ambientMotionPaused = useAmbientMotionPaused();
  const spinRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const spinTween = useRef<ReturnType<typeof gsap.to> | null>(null);
  const labelTween = useRef<ReturnType<typeof gsap.to> | null>(null);
  const pointerType = useRef<string | null>(null);

  useEffect(() => {
    const spinElement = spinRef.current;
    const labelElement = labelRef.current;
    if (!spinElement || !labelElement) return;

    const staticLayout = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 639px)",
    );
    const syncOrbit = () => {
      spinTween.current?.kill();
      labelTween.current?.kill();
      spinTween.current = null;
      labelTween.current = null;

      gsap.set(spinElement, { rotation: skill.angleDeg });
      gsap.set(labelElement, { rotation: -skill.angleDeg });
      if (staticLayout.matches) return;

      const duration = 90 / skill.speed;
      spinTween.current = gsap.to(spinElement, {
        rotation: skill.angleDeg + 360,
        duration,
        repeat: -1,
        ease: "none",
      });
      labelTween.current = gsap.to(labelElement, {
        rotation: -skill.angleDeg - 360,
        duration,
        repeat: -1,
        ease: "none",
      });
    };

    syncOrbit();
    staticLayout.addEventListener("change", syncOrbit);

    return () => {
      staticLayout.removeEventListener("change", syncOrbit);
      spinTween.current?.kill();
      labelTween.current?.kill();
      spinTween.current = null;
      labelTween.current = null;
    };
  }, [skill]);

  useEffect(() => {
    const scale = ambientMotionPaused ? 0 : isOrbitPaused ? 0.12 : 1;
    spinTween.current?.timeScale(scale);
    labelTween.current?.timeScale(scale);
  }, [ambientMotionPaused, isOrbitPaused]);

  return (
    <div
      ref={spinRef}
      className="absolute left-1/2 top-1/2 h-0 w-0"
      style={{ transform: `rotate(${skill.angleDeg}deg)` }}
    >
      <div
        className="skill-orbit-node absolute"
        style={{
          "--skill-orbit-offset": `calc(var(--solar) * ${skill.radiusRatio * 0.5})`,
        } as CSSProperties}
      >
        <button
          type="button"
          id={`skill-${skill.id}`}
          data-skill-planet={skill.id}
          aria-label={skill.name}
          aria-describedby={`skill-description-${skill.id} skill-navigation-help`}
          aria-pressed={isActive}
          onKeyDown={moveFocusAroundOrbit}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") onActivate();
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") onDeactivate();
          }}
          onPointerDown={(event) => {
            pointerType.current = event.pointerType;
          }}
          onFocus={onActivate}
          onBlur={onDeactivate}
          onClick={() => {
            if (pointerType.current === "touch" && isActive) {
              onDeactivate();
            } else {
              onActivate();
            }
            pointerType.current = null;
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
            style={{ transform: `rotate(${-skill.angleDeg}deg)` }}
            className={`mt-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.15em] transition-colors duration-300 ${
              isActive ? "text-accent" : "text-starlight/80"
            }`}
          >
            {skill.name}
          </span>
          <span id={`skill-description-${skill.id}`} className="sr-only">
            {skill.class}. Technologies: {skill.tech.join(", ")}.
          </span>
        </button>
      </div>
    </div>
  );
}
