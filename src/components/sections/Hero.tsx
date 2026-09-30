"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap";
import { DataPlate, DataRow } from "@/components/ui/DataPlate";
import { certificates } from "@/data/certificates";
import { navigateToSection } from "@/lib/sectionNavigation";

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
      className="relative flex min-h-screen min-h-svh items-center px-6 py-28 sm:px-16 lg:px-24"
    >
      <div className="hero-fade mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="hero-reveal font-mono text-xs uppercase tracking-[0.25em] text-gold sm:tracking-[0.4em]">
            Primary target · Deep field
          </p>
          <div className="mt-6 overflow-hidden">
            <h1 className="hero-line font-display text-[clamp(2.25rem,12vw,6rem)] font-medium tracking-tight text-starlight">
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
            Building LLM, voice AI, and backend systems for real-world products.
          </p>
          <div className="hero-reveal mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="#s-expertise"
              onClick={(event) => {
                event.preventDefault();
                navigateToSection("s-expertise");
              }}
              className="inline-flex min-h-11 items-center border border-accent/50 px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-accent transition-colors hover:bg-accent/10 focus-visible:bg-accent/10"
            >
              Explore expertise
            </Link>
            <Link
              href="#s-contact"
              onClick={(event) => {
                event.preventDefault();
                navigateToSection("s-contact");
              }}
              className="inline-flex min-h-11 items-center font-mono text-[10px] uppercase tracking-[0.2em] text-starlight/75 underline decoration-indigo/80 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              Contact Evry
            </Link>
          </div>
          <p className="hero-reveal mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/80">
            [ Scroll to begin survey ]
          </p>
        </div>

        <div className="hero-reveal hidden w-72 lg:block">
          <DataPlate title="Target identification">
            <DataRow k="Focus" v="AI engineering" />
            <DataRow k="Systems" v="LLM · Voice AI · Backend" />
            <DataRow k="Credentials" v={String(certificates.length)} />
          </DataPlate>
        </div>
      </div>
    </section>
  );
}
