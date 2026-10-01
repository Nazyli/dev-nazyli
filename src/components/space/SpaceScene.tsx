"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { AccretionDisk } from "./AccretionDisk";
import { AsteroidBelt } from "./AsteroidBelt";
import { Comet } from "./Comet";
import { DeepSkyGalaxy } from "./DeepSkyGalaxy";
import { DustClouds } from "./DustClouds";
import { Earth } from "./Earth";
import { Nebula } from "./Nebula";
import { Planet } from "./Planet";
import { PlanetarySystem } from "./PlanetarySystem";
import { ShootingStar } from "./ShootingStar";
import { SpaceCamera } from "./SpaceCamera";
import { Stars } from "./Stars";
import { SurveySatellite } from "./SurveySatellite";
import { useAmbientMotionPaused } from "@/hooks/useAmbientMotionPaused";
import { getSpaceColor } from "@/lib/spaceColors";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function isDocumentVisible() {
  return document.visibilityState === "visible";
}

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function ReadySignal({
  onReady,
  keepRendering,
}: {
  onReady?: () => void;
  keepRendering: boolean;
}) {
  const frame = useRef(0);
  const fired = useRef(false);

  useFrame((state) => {
    if (fired.current) return;
    frame.current += 1;
    if (frame.current >= 3 && !fired.current) {
      fired.current = true;
      onReady?.();
      return;
    }
    if (keepRendering) state.invalidate();
  });

  return null;
}

function InvalidateOnDemand({ enabled }: { enabled: boolean }) {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (enabled) invalidate();
  }, [enabled, invalidate]);

  return null;
}

function ContextLossSignal({ onContextLost }: { onContextLost?: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    if (!onContextLost) return;
    const handleContextLost = () => onContextLost();
    canvas.addEventListener("webglcontextlost", handleContextLost);
    return () =>
      canvas.removeEventListener("webglcontextlost", handleContextLost);
  }, [canvas, onContextLost]);

  return null;
}

export function SpaceScene({
  onReady,
  onContextLost,
}: {
  onReady?: () => void;
  onContextLost?: () => void;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => false,
  );
  const pageVisible = useSyncExternalStore(
    subscribeToVisibility,
    isDocumentVisible,
    () => true,
  );
  const ambientMotionPaused = useAmbientMotionPaused();
  const demandRender = reducedMotion || ambientMotionPaused;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        frameloop={
          !pageVisible ? "never" : demandRender ? "demand" : "always"
        }
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 0, -46] }}
      >
        <InvalidateOnDemand enabled={pageVisible && demandRender} />
        <ContextLossSignal onContextLost={onContextLost} />
        <ambientLight intensity={0.12} />
        <directionalLight position={[-14, 5, -9]} intensity={2.4} color={getSpaceColor("planet-cream")} />
        <directionalLight position={[10, -4, 6]} intensity={0.16} color={getSpaceColor("nebula-blue")} />
        <Nebula />
        <DustClouds />
        <DeepSkyGalaxy />
        <Stars />
        <AsteroidBelt />
        <PlanetarySystem />
        <Comet />
        <AccretionDisk />
        <ShootingStar />
        <Planet position={[3.4, 0.8, -26]} radius={1} />
        <Earth position={[7, 12.2, 150]} radius={5.5} />
        <SurveySatellite />
        <SpaceCamera />
        <ReadySignal onReady={onReady} keepRendering={demandRender} />
      </Canvas>
    </div>
  );
}
