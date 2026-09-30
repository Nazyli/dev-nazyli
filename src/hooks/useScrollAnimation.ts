"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollController } from "@/lib/scrollController";
import { universeState } from "@/lib/universeState";

export function useScrollAnimation() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    universeState.reducedMotion = reduced;

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      respectReducedMotion: true,
    });
    scrollController.lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
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
      gsap.ticker.remove(tick);
      return () => {
        universeState.reducedMotion = false;
      };
    });
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      universeState.reducedMotion = false;
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      mm.revert();
      master.kill();
      gsap.ticker.remove(tick);
      scrollController.lenis = null;
      lenis.destroy();
    };
  }, []);
}
