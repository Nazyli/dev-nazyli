"use client";

import { useId, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buildConstellationPath, projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import { SectionHeading } from "@/components/ui/SectionHeading";

function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="border border-starlight/25 bg-abyss/50">
      <header className="flex items-center justify-between border-b border-starlight/15 bg-indigo/10 px-4 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/60">
          Observation record
        </p>
        <p className="font-mono text-[10px] tracking-[0.25em] text-gold">
          REC-{project.index}
        </p>
      </header>
      <div className="p-5">
        <h3 className="font-display text-2xl font-medium tracking-tight text-starlight">
          {project.title}
        </h3>
        <div className="mt-4 flex items-baseline justify-between gap-6 border-t border-indigo/15 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-starlight/60">
            Bands
          </span>
          <span className="text-right font-mono text-[10px] uppercase tracking-[0.15em] text-starlight/70">
            {project.tags.join(" · ")}
          </span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-starlight/70">
          {project.description}
        </p>
        {project.link && (
          <a
            href={project.link}
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-accent"
          >
            Explore project <span aria-hidden>→</span>
          </a>
        )}
      </div>
    </article>
  );
}

function CatalogLine({ project }: { project: Project }) {
  return (
    <p className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-starlight/80 sm:block">
      STARS {project.constellation.stars.length} · LINKS{" "}
      {project.constellation.lines.length} · EPOCH 2026
    </p>
  );
}

function ConstellationSvg({
  project,
  staticDraw = false,
  pathRef,
}: {
  project: Project;
  staticDraw?: boolean;
  pathRef?: (el: SVGPathElement | null) => void;
}) {
  const gradientId = useId().replace(/:/g, "");

  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-[min(46vmin,340px)] w-[min(46vmin,340px)] md:h-[min(70vmin,640px)] md:w-[min(70vmin,640px)]">
        <defs>
          <radialGradient id={`${gradientId}-core`} cx="35%" cy="35%" r="75%">
            <stop offset="0%" style={{ stopColor: "var(--color-starlight)" }} />
            <stop offset="55%" style={{ stopColor: "var(--color-gold)" }} />
            <stop
              offset="100%"
              style={{
                stopColor: "color-mix(in srgb, var(--color-gold) 55%, #000)",
              }}
            />
          </radialGradient>
        </defs>
        <path
          ref={pathRef}
          d={buildConstellationPath(project)}
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: staticDraw ? 0 : 1 }}
          className="fill-none stroke-accent"
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
            r={s % 2 === 0 ? 1.8 : 1.3}
            fill={`url(#${gradientId}-core)`}
          />
        ))}
      </svg>
      <CatalogLine project={project} />
    </div>
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
      const sectionPct = ((slides - 1) / slides) * 100;

      projects.forEach((_, i) => {
        const path = pathRefs.current[i];
        if (!path) return;
        const startPct = (i / slides) * sectionPct;
        const endPct = ((i + 1) / slides) * sectionPct;
        gsap.fromTo(
          path,
          { strokeDashoffset: 1 },
          {
            strokeDashoffset: 0,
            ease: "none",
            scrollTrigger: {
              trigger: root.current,
              start: `${startPct}% top`,
              end: `${endPct}% top`,
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
      <div id="s-projects" role="region" aria-label="Projects" className="relative">
        <div className="flex min-h-screen flex-col items-center justify-center gap-16 px-6 pt-24">
          <div className="text-center">
            <SectionHeading
              index="03"
              label="Projects"
              descriptor="Constellation log"
              align="center"
            />
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-starlight">
              Constellations of work.
            </h2>
          </div>
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col items-center justify-center gap-10"
            >
              <ConstellationSvg project={project} staticDraw />
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      id="s-projects"
      ref={root}
      role="region"
      aria-label="Projects"
      style={{ height: `${projects.length * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute left-6 top-16 md:left-24">
          <SectionHeading
            index="03"
            label="Projects"
            descriptor="Constellation log"
          />
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
            <ConstellationSvg
              project={project}
              pathRef={(el) => {
                pathRefs.current[i] = el;
              }}
            />
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
