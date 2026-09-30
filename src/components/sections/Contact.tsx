"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { SectionHeading } from "@/components/ui/SectionHeading";

const EMAIL_ADDRESS = "info@nazyli.com";

export function Contact() {
  const root = useRef<HTMLElement>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "unavailable">("idle");

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
    { label: "Email Evry", href: `mailto:${EMAIL_ADDRESS}`, primary: true },
    { label: "GitHub", href: "https://github.com/Nazyli" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/evrynazyli/" },
  ];

  return (
    <section
      id="s-contact"
      ref={root}
      aria-label="Contact"
      className="relative flex min-h-screen min-h-svh flex-col items-center justify-center px-6 pb-24 pt-20 text-center lg:py-24"
    >
      <SectionHeading
        index="07"
        label="Contact"
        descriptor="Downlink"
        align="center"
        className="contact-reveal"
      />
      <h2 className="contact-reveal mt-8 max-w-2xl font-display text-4xl font-medium leading-tight tracking-tight text-starlight sm:text-6xl">
        Have an idea worth building?
      </h2>
      <p className="contact-reveal mt-6 font-mono text-sm uppercase tracking-[0.3em] text-accent max-[360px]:text-xs max-[360px]:tracking-[0.2em]">
        Let&apos;s build something intelligent.
      </p>

      <ul className="contact-reveal mt-14 grid w-full max-w-2xl grid-cols-3 items-stretch justify-center gap-x-2 max-[360px]:mt-8 sm:flex sm:items-center sm:gap-12">
        {links.map((link, i) => (
          <li key={link.label}>
            <div className={link.primary ? "flex flex-col items-center" : ""}>
              <a
                href={link.href}
                className={`group flex min-h-11 w-full flex-col items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors duration-300 focus-visible:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-accent sm:w-auto sm:text-xs sm:tracking-[0.3em] ${
                  link.primary
                    ? "border border-accent/50 px-2 text-accent hover:bg-accent/10 focus-visible:bg-accent/10 sm:px-4"
                    : "px-2 text-starlight/70 hover:text-accent"
                }`}
              >
                <span className="font-mono text-[9px] tracking-[0.3em] text-starlight/60 transition-colors duration-300 group-hover:text-gold">
                  CH-0{i + 1}
                </span>
                {link.label}
              </a>
              {link.primary && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(EMAIL_ADDRESS);
                      setCopyStatus("copied");
                    } catch {
                      setCopyStatus("unavailable");
                    }
                  }}
                  aria-label={`Copy ${EMAIL_ADDRESS} to clipboard`}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 px-2 font-mono text-[9px] uppercase tracking-[0.1em] text-starlight/70 transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      d="M5.5 5.5h7v8h-7zM3.5 10.5h-1v-8h7v1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    />
                  </svg>
                  Copy address
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="contact-reveal mt-2 min-h-5 font-mono text-[9px] uppercase tracking-[0.16em] text-starlight/65"
      >
        {copyStatus === "copied"
          ? "Email address copied."
          : copyStatus === "unavailable"
            ? "Clipboard unavailable. Use Email Evry to open a message."
            : ""}
      </p>

      <footer className="contact-reveal absolute bottom-16 left-0 right-0 lg:bottom-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-starlight/75">
          Evry Nazyli - 2026
        </p>
      </footer>
    </section>
  );
}
