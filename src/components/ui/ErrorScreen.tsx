"use client";

import Link from "next/link";

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-abyss focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-[0.25em] focus:text-accent"
      >
        Skip to content
      </a>
      <main
        id="main"
        tabIndex={-1}
        role="alert"
        aria-labelledby="error-title"
        className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-void px-6 py-16 text-starlight"
      >
        <Link
          href="/"
          className="absolute left-6 top-6 inline-flex min-h-11 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-starlight/75 transition-colors hover:text-accent focus-visible:text-accent sm:left-10 sm:top-8"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
          Nazyli · Deep-Sky Observatory
        </Link>

        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 border-y border-indigo/40 py-10 sm:gap-14 sm:py-16 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold">
              Flight recorder · signal interrupted
            </p>
            <h1
              id="error-title"
              className="mt-5 max-w-xl font-display text-4xl font-medium leading-tight tracking-tight text-starlight sm:text-6xl"
            >
              This survey lost its signal.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-starlight/70 sm:text-base">
              The page could not finish loading. Try again, or return to the
              observatory home page.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-12 items-center border border-accent/55 px-4 font-mono text-[10px] uppercase tracking-[0.22em] text-accent transition-colors hover:bg-accent/10 hover:text-starlight focus-visible:bg-accent/10"
              >
                Retry this page
              </button>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center border border-indigo/70 px-4 font-mono text-[10px] uppercase tracking-[0.22em] text-starlight/75 transition-colors hover:border-gold/60 hover:text-gold focus-visible:text-gold"
              >
                Return home
              </Link>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-[17rem] sm:max-w-[20rem]">
            <svg
              aria-hidden="true"
              viewBox="0 0 280 280"
              className="h-auto w-full"
            >
              <circle
                cx="140"
                cy="140"
                r="112"
                className="fill-none stroke-indigo/70"
                strokeWidth="1"
              />
              <ellipse
                cx="140"
                cy="140"
                rx="122"
                ry="56"
                transform="rotate(-34 140 140)"
                className="fill-none stroke-indigo/80"
                strokeWidth="1"
                strokeDasharray="184 34 90 46"
              />
              <circle
                cx="140"
                cy="140"
                r="46"
                className="fill-none stroke-gold/50"
                strokeWidth="1"
              />
              <path
                d="M193 61v27m-13.5-13.5h27M193 48v7m0 52v7m-26-40h7m38 0h7"
                className="fill-none stroke-accent"
                strokeWidth="1"
              />
              <circle cx="193" cy="74.5" r="3" className="fill-gold" />
              <circle cx="79" cy="194" r="2.5" className="fill-starlight/70" />
              <path
                d="M140 128v24m-12-12h24"
                className="fill-none stroke-indigo"
                strokeWidth="1"
              />
            </svg>
            <figcaption className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-starlight/55">
              Connection · retry available
            </figcaption>
          </figure>
        </div>
      </main>
    </>
  );
}
