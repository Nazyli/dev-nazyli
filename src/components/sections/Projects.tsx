"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buildConstellationPath, projects } from "@/data/projects";
import type { Project } from "@/data/projects";

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="border border-indigo/40 bg-abyss/70 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">
        {project.index}
      </p>
      <h3 className="mt-4 font-display text-2xl font-medium tracking-tight text-starlight">
        {project.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-starlight/70">
        {project.description}
      </p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li
            key={tag}
            className="border border-indigo/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-starlight/60"
          >
            {tag}
          </li>
        ))}
      </ul>
      {project.link && (
        <a
          href={project.link}
          className="mt-6 inline-block font-mono text-xs uppercase tracking-[0.25em] text-accent"
        >
          Explore project →
        </a>
      )}
    </div>
  );
}

function ConstellationSvg({
  project,
  staticDraw = false,
}: {
  project: Project;
  staticDraw?: boolean;
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-[min(52vmin,380px)] w-[min(52vmin,380px)]">
      <path
        d={buildConstellationPath(project)}
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: staticDraw ? 0 : 1 }}
        className="fill-none"
        stroke="#66d9e8"
        strokeOpacity={0.55}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {project.constellation.stars.map(([x, y], s) => (
        <circle
          key={s}
          cx={x}
          cy={y}
          r={s % 2 === 0 ? 1.6 : 1.1}
          fill="#d9b36a"
        />
      ))}
    </svg>
  );
}

export function Projects() {
  const root = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const reduced = useReducedMotion();
  const [slide, setSlide] = useState(0);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const slides = projects.length;
      const travelPct = (slides - 1) * 100;

      projects.forEach((_, i) => {
        const path = pathRefs.current[i];
        if (!path) return;
        gsap.fromTo(
          path,
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: `${(i * travelPct) / slides}% top`,
              end: `${((i + 1) * travelPct) / slides}% top`,
              scrub: true,
            },
          }
        );
      });

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(
            slides - 1,
            Math.floor(self.progress * slides)
          );
          setSlide((prev) => (prev === idx ? prev : idx));
        },
      });
    });
  }, []);

  if (reduced) {
    return (
      <div role="region" aria-label="Projects" className="relative">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex min-h-screen flex-col items-center justify-center gap-10 px-6"
          >
            <ConstellationSvg project={project} staticDraw />
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={root}
      role="region"
      aria-label="Projects"
      style={{ height: `${projects.length * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute left-6 top-16 md:left-24">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">
            03 · Projects
          </p>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-starlight">
            Constellations of work.
          </h2>
        </div>

        {projects.map((project, i) => (
          <div
            key={project.id}
            aria-hidden={slide !== i}
            className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
              slide === i ? "opacity-100" : "opacity-0"
            }`}
          >
            <svg viewBox="0 0 100 100" className="h-[min(52vmin,380px)] w-[min(52vmin,380px)]">
              <path
                ref={(el) => {
                  pathRefs.current[i] = el;
                }}
                d={buildConstellationPath(project)}
                pathLength={1}
                style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                className="fill-none"
                stroke="#66d9e8"
                strokeOpacity={0.55}
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {project.constellation.stars.map(([x, y], s) => (
                <circle
                  key={s}
                  cx={x}
                  cy={y}
                  r={s % 2 === 0 ? 1.6 : 1.1}
                  fill="#d9b36a"
                />
              ))}
            </svg>
          </div>
        ))}

        {projects.map((project, i) => (
          <div
            key={project.id}
            aria-hidden={slide !== i}
            className={`absolute left-6 top-1/2 w-full max-w-sm -translate-y-1/2 transition-opacity duration-500 max-md:bottom-14 max-md:top-auto max-md:translate-y-0 md:left-24 ${
              slide === i ? "opacity-100" : "opacity-0"
            }`}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </div>
  );
}
