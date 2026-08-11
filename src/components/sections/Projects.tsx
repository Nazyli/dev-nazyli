"use client";

import { useId, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { buildConstellationPath, certificates } from "@/data/certificates";
import type { Certificate } from "@/data/certificates";
import { SectionHeading } from "@/components/ui/SectionHeading";

function CertificateCard({ cert }: { cert: Certificate }) {
  return (
    <article className="border border-starlight/25 bg-abyss/50">
      <header className="flex items-center justify-between border-b border-starlight/15 bg-indigo/10 px-4 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/60">
          Certificate record
        </p>
        <p className="font-mono text-[10px] tracking-[0.25em] text-gold">
          REC-{String(cert.no).padStart(2, "0")}
        </p>
      </header>
      <div className="p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
          {cert.provider}
        </p>
        <h3 className="mt-2 font-display text-2xl font-medium tracking-tight text-starlight">
          {cert.title}
        </h3>
        <div className="mt-4 flex items-baseline justify-between gap-6 border-t border-indigo/15 pt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-starlight/60">
            Valid
          </span>
          <span className="text-right font-mono text-[10px] uppercase tracking-[0.15em] text-starlight/70">
            {cert.from} — {cert.to ?? "PRESENT"}
          </span>
        </div>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {cert.skills.map((skill) => (
            <li
              key={skill}
              className="border border-indigo/30 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-starlight/70"
            >
              {skill}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function CatalogLine({ cert }: { cert: Certificate }) {
  return (
    <p className="hidden font-mono text-[9px] uppercase tracking-[0.3em] text-starlight/80 sm:block">
      STARS {cert.constellation.stars.length} · LINKS{" "}
      {cert.constellation.lines.length} · EPOCH 2026
    </p>
  );
}

function ConstellationSvg({
  cert,
  staticDraw = false,
  pathRef,
}: {
  cert: Certificate;
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
          d={buildConstellationPath(cert)}
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: staticDraw ? 0 : 1 }}
          className="fill-none stroke-accent"
          strokeOpacity={0.55}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {cert.constellation.stars.map(([x, y], s) => (
          <circle
            key={s}
            cx={x}
            cy={y}
            r={s % 2 === 0 ? 1.8 : 1.3}
            fill={`url(#${gradientId}-core)`}
            style={{
              filter:
                "drop-shadow(0 0 2px color-mix(in srgb, var(--color-gold) 85%, transparent))",
            }}
          />
        ))}
      </svg>
      <CatalogLine cert={cert} />
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
      const slides = certificates.length;
      const sectionPct = ((slides - 1) / slides) * 100;

      certificates.forEach((_, i) => {
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
      <div id="s-projects" role="region" aria-label="Certificates" className="relative">
        <div className="flex min-h-screen flex-col items-center justify-center gap-16 px-6 pt-24">
          <div className="text-center">
            <SectionHeading
              index="03"
              label="Certificates"
              descriptor="Constellation log"
              align="center"
            />
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-starlight">
              Constellations of learning.
            </h2>
          </div>
          {certificates.map((cert) => (
            <div
              key={cert.no}
              className="flex flex-col items-center justify-center gap-10"
            >
              <ConstellationSvg cert={cert} staticDraw />
              <CertificateCard cert={cert} />
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
      aria-label="Certificates"
      style={{ height: `${certificates.length * 100}vh` }}
      className="relative"
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden px-6">
        <div className="absolute left-6 top-16 md:left-24">
          <SectionHeading
            index="03"
            label="Certificates"
            descriptor="Constellation log"
          />
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight text-starlight">
            Constellations of learning.
          </h2>
        </div>

        {certificates.map((cert, i) => (
          <div
            key={cert.no}
            aria-hidden={slide !== i}
            className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
              slide === i ? "opacity-100" : "opacity-0"
            }`}
          >
            <ConstellationSvg
              cert={cert}
              pathRef={(el) => {
                pathRefs.current[i] = el;
              }}
            />
          </div>
        ))}

        {certificates.map((cert, i) => (
          <div
            key={cert.no}
            aria-hidden={slide !== i}
            className={`absolute left-6 top-1/2 w-full max-w-sm -translate-y-1/2 transition-opacity duration-500 max-md:bottom-14 max-md:top-auto max-md:translate-y-0 md:left-24 ${
              slide === i ? "opacity-100" : "opacity-0"
            }`}
          >
            <CertificateCard cert={cert} />
          </div>
        ))}
      </div>
    </div>
  );
}
