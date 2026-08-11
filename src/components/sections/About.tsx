"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".about-reveal", {
          x: -48,
          opacity: 0,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
          },
        });
      });
    },
    { scope: root }
  );

  return (
    <section
      ref={root}
      aria-label="About"
      className="relative flex min-h-screen items-center px-6 sm:px-16 lg:px-24"
    >
      <div className="max-w-2xl">
        <p className="about-reveal font-mono text-xs uppercase tracking-[0.35em] text-gold">
          01 · About
        </p>
        <h2 className="about-reveal mt-6 font-display text-4xl font-medium leading-tight tracking-tight text-starlight sm:text-5xl lg:text-6xl">
          AI Engineer, focused on intelligent applications, LLM systems &
          backend engineering.
        </h2>
        <div className="about-reveal mt-10 h-px w-24 bg-gold/40" />
        <p className="about-reveal mt-10 max-w-md text-lg leading-relaxed text-starlight/70">
          I build systems that reason, remember, and act — turning ideas into
          experiences for the real world.
        </p>
      </div>
    </section>
  );
}
