"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scrollController } from "@/lib/scrollController";
import { setCameraScrollStops } from "@/lib/cameraPath";
import { universeState } from "@/lib/universeState";
import { SECTION_REGISTRY } from "@/data/sections";

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

    const syncCameraStops = () => {
      const scrollRange = ScrollTrigger.maxScroll(window);
      const sectionStops = SECTION_REGISTRY.map((section, index) => {
        if (index === 0) return 0;
        if (index === SECTION_REGISTRY.length - 1) return 1;

        const element = document.getElementById(section.id);
        if (!element) return index / (SECTION_REGISTRY.length - 1);

        const anchor = element.closest<HTMLElement>(".pin-spacer") ?? element;
        const rect = anchor.getBoundingClientRect();
        const centerScroll =
          rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;

        return scrollRange > 0 ? centerScroll / scrollRange : 0;
      });

      setCameraScrollStops(sectionStops);
    };

    ScrollTrigger.addEventListener("refresh", syncCameraStops);

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

    let refreshFrame = 0;
    const scheduleRefresh = () => {
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    const certificateSection = document.getElementById("s-certificates");
    const resizeObserver = certificateSection && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(scheduleRefresh)
      : null;
    if (certificateSection) resizeObserver?.observe(certificateSection);

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("load", onLoad);
      ScrollTrigger.removeEventListener("refresh", syncCameraStops);
      resizeObserver?.disconnect();
      cancelAnimationFrame(refreshFrame);
      mm.revert();
      master.kill();
      gsap.ticker.remove(tick);
      scrollController.lenis = null;
      lenis.destroy();
    };
  }, []);
}
