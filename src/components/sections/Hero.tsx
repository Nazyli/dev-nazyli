"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

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
      ref={root}
      className="relative flex min-h-screen items-center justify-center px-6 text-center"
    >
      <div className="hero-fade space-y-7">
        <p className="hero-reveal font-mono text-xs uppercase tracking-[0.4em] text-gold">
          Into my universe
        </p>
        <div className="overflow-hidden">
          <h1 className="hero-line font-display text-6xl font-medium tracking-tight text-starlight sm:text-8xl">
            EVRY NAZYLI
          </h1>
        </div>
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
