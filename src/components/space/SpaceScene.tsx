"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useSyncExternalStore } from "react";
import { AccretionDisk } from "./AccretionDisk";
import { DustClouds } from "./DustClouds";
import { Earth } from "./Earth";
import { Nebula } from "./Nebula";
import { Planet } from "./Planet";
import { ShootingStar } from "./ShootingStar";
import { SpaceCamera } from "./SpaceCamera";
import { Stars } from "./Stars";
import { SurveySatellite } from "./SurveySatellite";

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
  reducedMotion,
}: {
  onReady?: () => void;
  reducedMotion: boolean;
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
    if (reducedMotion) state.invalidate();
  });

  return null;
}

export function SpaceScene({ onReady }: { onReady?: () => void }) {
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

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        frameloop={
          !pageVisible ? "never" : reducedMotion ? "demand" : "always"
        }
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 0, -46] }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[14, 5, 9]} intensity={3.2} color="#f5efe0" />
        <directionalLight position={[-10, -4, -6]} intensity={0.5} color="#1e213f" />
        <Nebula />
        <DustClouds />
        <Stars />
        <AccretionDisk />
        <ShootingStar />
        <Planet position={[3.4, 0.8, -26]} radius={1} />
        <Earth position={[7, 12.2, 150]} radius={5.5} />
        <SurveySatellite />
        <SpaceCamera />
        <ReadySignal onReady={onReady} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
