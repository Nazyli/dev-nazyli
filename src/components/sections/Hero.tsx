"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DataPlate, DataRow } from "@/components/ui/DataPlate";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-line", {
          yPercent: 120,
          duration: 1.2,
          ease: "power4.out",
          delay: 0.3,
        });
        gsap.from(".hero-reveal", {
          y: 24,
          opacity: 0,
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.5,
        });
        gsap.to(".hero-fade", {
          opacity: 0,
          y: -60,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom 20%",
            scrub: true,
          },
        });
      });
    },
    { scope: root }
  );

  return (
    <section
      id="s-hero"
      ref={root}
      aria-label="Introduction"
      className="relative flex min-h-screen items-center px-6 py-28 sm:px-16 lg:px-24"
    >
      <div className="hero-fade mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="hero-reveal font-mono text-xs uppercase tracking-[0.4em] text-gold">
            Primary target · Deep field
          </p>
          <div className="mt-6 overflow-hidden">
            <h1 className="hero-line font-display text-6xl font-medium tracking-tight text-starlight sm:text-8xl">
              EVRY NAZYLI
            </h1>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <span aria-hidden className="h-px w-10 bg-accent/60" />
            <p className="hero-reveal font-mono text-sm uppercase tracking-[0.35em] text-accent">
              AI Engineer
            </p>
          </div>
          <p className="hero-reveal mt-8 max-w-md text-lg leading-relaxed text-starlight/70">
            Building intelligent systems for the real world.
          </p>
          <p className="hero-reveal mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/80">
            [ Scroll to begin survey ]
          </p>
        </div>

        <div className="hero-reveal hidden w-72 lg:block">
          <DataPlate title="Target identification">
            <DataRow k="Designation" v="EVRY-01" />
            <DataRow k="Classification" v="AI ENGINEER" />
            <DataRow k="Field" v="Intelligent applications" />
            <DataRow k="Systems" v="LLM · RAG · Voice AI" />
          </DataPlate>
        </div>
      </div>
    </section>
  );
}
