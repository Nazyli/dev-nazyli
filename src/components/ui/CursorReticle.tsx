"use client";

import { useEffect, useRef } from "react";

export function CursorReticle() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    el.style.opacity = "1";

    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="obs-reticle opacity-0 transition-opacity duration-500"
    >
      <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-accent/40" />
      <span className="absolute bottom-0 left-1/2 h-3 w-px -translate-x-1/2 bg-accent/40" />
      <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-accent/40" />
      <span className="absolute right-0 top-1/2 h-px w-3 -translate-y-1/2 bg-accent/40" />
    </div>
  );
}
