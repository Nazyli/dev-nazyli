"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useEntrance } from "@/components/providers/EntranceProvider";
import { supportsWebGL } from "@/lib/webgl";
import { SpaceSceneErrorBoundary } from "./SpaceSceneErrorBoundary";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

const SpaceScene = dynamic(
  () => import("./SpaceScene").then((m) => m.SpaceScene),
  { ssr: false, loading: () => null }
);

function StaticStarMap() {
  return <div aria-hidden="true" className="star-map-fallback fixed inset-0 z-0" />;
}

export function SpaceSceneDynamic() {
  const { markReady } = useEntrance();
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const handleContextLost = useCallback(() => {
    setWebgl(false);
    markReady();
  }, [markReady]);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => false,
  );

  useEffect(() => {
    if (reducedMotion) return;
    let alive = true;
    let frameId = 0;
    let loadingTimeout = 0;
    frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => {
        if (!alive) return;
        const supported = supportsWebGL();
        setWebgl(supported);
        if (!supported) {
          setMounted(true);
          return;
        }

        loadingTimeout = window.setTimeout(() => {
          if (alive) setMounted(true);
        }, 1100);
        void import("@/lib/planetaryTextures")
          .then(({ preloadPlanetaryImageTextures }) => preloadPlanetaryImageTextures())
          .catch(() => {})
          .finally(() => {
            window.clearTimeout(loadingTimeout);
            if (alive) setMounted(true);
          });
      });
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      window.clearTimeout(loadingTimeout);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || (mounted && !webgl)) markReady();
  }, [reducedMotion, mounted, webgl, markReady]);

  if (reducedMotion || !mounted || !webgl) {
    return <StaticStarMap />;
  }

  return (
    <SpaceSceneErrorBoundary fallback={<StaticStarMap />} onError={markReady}>
      <SpaceScene onReady={markReady} onContextLost={handleContextLost} />
    </SpaceSceneErrorBoundary>
  );
}
