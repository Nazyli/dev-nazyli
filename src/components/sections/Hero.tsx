"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-reveal", {
          y: 28,
          opacity: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: "power3.out",
          delay: 0.4,
        });
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      className="relative flex min-h-screen items-center justify-center px-6 text-center"
    >
      <div className="space-y-7">
        <p className="hero-reveal font-mono text-xs uppercase tracking-[0.4em] text-gold">
          Into my universe
        </p>
        <h1 className="hero-reveal font-display text-6xl font-medium tracking-tight text-starlight sm:text-8xl">
          EVRY NAZYLI
        </h1>
        <p className="hero-reveal font-mono text-sm uppercase tracking-[0.35em] text-accent">
          AI Engineer
        </p>
        <p className="hero-reveal mx-auto max-w-md text-lg leading-relaxed text-starlight/70">
          Building intelligent systems for the real world.
        </p>
        <p className="hero-reveal font-mono text-xs uppercase tracking-[0.3em] text-starlight/40">
          Scroll to explore
        </p>
      </div>
    </section>
  );
}
