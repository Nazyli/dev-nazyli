"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { DataPlate, DataRow } from "@/components/ui/DataPlate";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
    { scope: root },
  );

  return (
    <section
      id="s-about"
      ref={root}
      aria-label="About"
      className="relative flex min-h-screen items-center px-6 py-24 sm:px-16 lg:px-24"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <SectionHeading
            index="01"
            label="About"
            descriptor="Observer profile"
            className="about-reveal"
          />
          <h2 className="about-reveal mt-8 font-display text-4xl font-medium leading-tight tracking-tight text-starlight sm:text-5xl lg:text-6xl">
            AI Engineer, focused on intelligent applications, LLM systems &
            backend engineering.
          </h2>
          <div className="about-reveal mt-10 h-px w-24 bg-gold/40" />
          <p className="about-reveal mt-10 max-w-md text-lg leading-relaxed text-starlight/70">
            I build systems that reason, remember, and act - turning ideas into
            experiences for the real world.
          </p>
        </div>

        <div className="about-reveal">
          <DataPlate title="Observer record">
            <DataRow k="Observer" v="Evry Nazyli" />
            <DataRow k="Role" v="AI Engineer" />
            <DataRow k="Focus" v="LLM systems · Backend" />
            <DataRow k="Sector" v="Intelligent applications" />
            <DataRow k="Instruments" v="Next.js · TypeScript · Three.js" />
          </DataPlate>
        </div>
      </div>
    </section>
  );
}
