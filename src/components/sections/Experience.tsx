"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { experience } from "@/data/experience";

export function Experience() {
  const root = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        if (fillRef.current) {
          gsap.fromTo(
            fillRef.current,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: root.current,
                start: "top 60%",
                end: "bottom 70%",
                scrub: true,
              },
            }
          );
        }

        gsap.utils.toArray<HTMLElement>(".exp-entry").forEach((entry) => {
          gsap.fromTo(
            entry,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: {
                trigger: entry,
                start: "top 82%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        gsap.utils.toArray<HTMLElement>(".exp-node").forEach((node) => {
          ScrollTrigger.create({
            trigger: node,
            start: "top 78%",
            onEnter: () => node.classList.add("node-lit"),
            onLeaveBack: () => node.classList.remove("node-lit"),
          });
        });
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      aria-label="Experience"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-24"
    >
      <div className="mb-20 text-center">
        <p className="exp-reveal font-mono text-xs uppercase tracking-[0.35em] text-gold">
          04 · Experience
        </p>
        <h2 className="exp-reveal mt-4 font-display text-3xl font-medium tracking-tight text-starlight sm:text-4xl">
          A journey through systems.
        </h2>
      </div>

      <div className="relative mx-auto w-full max-w-4xl">
        <div className="absolute bottom-0 left-[19px] top-0 w-px bg-indigo/30 md:left-1/2">
          <div
            ref={fillRef}
            className="h-full w-full origin-top scale-y-0 bg-accent"
          />
        </div>

        {experience.map((entry, i) => {
          const onLeft = i % 2 === 0;
          return (
            <div
              key={entry.id}
              className="exp-entry relative mb-20 pl-12 last:mb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0"
            >
              <span className="exp-node absolute left-[19px] top-2 h-2 w-2 rounded-full border border-gold bg-void md:left-1/2 md:-translate-x-1/2" />
              <div
                className={
                  onLeft ? "md:col-start-1 md:text-right" : "md:col-start-2"
                }
              >
                <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">
                  {entry.period}
                </p>
                <h3 className="mt-3 font-display text-2xl font-medium tracking-tight text-starlight">
                  {entry.role}
                </h3>
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.25em] text-accent">
                  {entry.company}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-starlight/60">
                  {entry.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
