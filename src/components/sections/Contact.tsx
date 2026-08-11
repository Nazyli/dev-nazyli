"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".contact-reveal", {
          y: 28,
          opacity: 0,
          duration: 1,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root.current,
            start: "top 60%",
          },
        });
      });
    },
    { scope: root },
  );

  const links = [
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Email", href: "#" },
  ];

  return (
    <section
      id="s-contact"
      ref={root}
      aria-label="Contact"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <SectionHeading
        index="05"
        label="Contact"
        descriptor="Downlink"
        align="center"
        className="contact-reveal"
      />
      <h2 className="contact-reveal mt-8 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight text-starlight sm:text-6xl">
        Have an idea worth building?
      </h2>
      <p className="contact-reveal mt-6 font-mono text-sm uppercase tracking-[0.3em] text-accent">
        Let&apos;s build something intelligent.
      </p>

      <ul className="contact-reveal mt-14 flex flex-wrap items-center justify-center gap-12">
        {links.map((link, i) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="group flex flex-col items-center gap-2 font-mono text-xs uppercase tracking-[0.3em] text-starlight/70 transition-colors duration-300 hover:text-accent focus-visible:text-accent"
            >
              <span className="font-mono text-[9px] tracking-[0.3em] text-starlight/60 transition-colors duration-300 group-hover:text-gold">
                CH-0{i + 1}
              </span>
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <footer className="contact-reveal absolute bottom-8 left-0 right-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/75">
          Evry Nazyli - 2026
        </p>
      </footer>
    </section>
  );
}
