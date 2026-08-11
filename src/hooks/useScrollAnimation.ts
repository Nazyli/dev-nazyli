"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { universeState } from "@/lib/universeState";

export function useScrollAnimation() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    universeState.reducedMotion = reduced;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: !reduced,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const master = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        universeState.progress = self.progress;
      },
    });

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: reduce)", () => {
      universeState.reducedMotion = true;
      return () => {
        universeState.reducedMotion = false;
      };
    });
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      universeState.reducedMotion = false;
      return () => {};
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      mm.revert();
      master.kill();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}
