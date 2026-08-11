"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useEntrance } from "@/components/providers/EntranceProvider";
import { supportsWebGL } from "@/lib/webgl";

const SpaceScene = dynamic(
  () => import("./SpaceScene").then((m) => m.SpaceScene),
  { ssr: false, loading: () => null }
);

export function SpaceSceneDynamic() {
  const { markReady } = useEntrance();
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    let alive = true;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!alive) return;
        setWebgl(supportsWebGL());
        setMounted(true);
      });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    if (mounted && !webgl) markReady();
  }, [mounted, webgl, markReady]);

  if (!mounted) return null;
  return <SpaceScene onReady={markReady} />;
}
