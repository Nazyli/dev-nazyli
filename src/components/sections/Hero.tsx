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
            <DataRow k="Since" v="2017" />
            <DataRow k="Path" v="Web → Backend → AI" />
            <DataRow k="Projects" v="21" />
            <DataRow k="Certificates" v="13" />
            <DataRow k="Experience" v="9 yrs" />
          </DataPlate>
        </div>
      </div>
    </section>
  );
}
