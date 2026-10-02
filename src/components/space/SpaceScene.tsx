"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import * as THREE from "three";
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
import {
  getOpeningSystemLateralOffset,
  getOpeningSystemOffset,
  getPlanetaryBodyPosition,
} from "@/lib/planetaryTour";
import { universeState } from "@/lib/universeState";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SATURN_POSITION = getPlanetaryBodyPosition(
  "Saturn",
  new THREE.Vector3(),
).toArray() as [number, number, number];

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
  assetsReady,
  keepRendering,
}: {
  onReady?: () => void;
  assetsReady: boolean;
  keepRendering: boolean;
}) {
  const frame = useRef(0);
  const fired = useRef(false);

  useFrame((state) => {
    if (fired.current) return;
    if (!assetsReady) {
      if (keepRendering) state.invalidate();
      return;
    }
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

function OpeningSystemOffset({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (group.current) {
      const progress = universeState.reducedMotion ? 0 : universeState.progress;
      group.current.position.x = getOpeningSystemLateralOffset(progress);
      group.current.position.z = getOpeningSystemOffset(progress);
    }
  });

  return <group ref={group}>{children}</group>;
}

export function SpaceScene({
  onReady,
  onContextLost,
}: {
  onReady?: () => void;
  onContextLost?: () => void;
}) {
  const [planetTexturesReady, setPlanetTexturesReady] = useState(false);
  const [earthTexturesReady, setEarthTexturesReady] = useState(false);
  const markPlanetTexturesReady = useCallback(() => setPlanetTexturesReady(true), []);
  const markEarthTexturesReady = useCallback(() => setEarthTexturesReady(true), []);
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
      className={`space-nebula-backdrop pointer-events-none fixed inset-0 z-0${
        ambientMotionPaused || reducedMotion ? " motion-paused" : ""
      }`}
    >
      <Canvas
        frameloop={
          !pageVisible ? "never" : demandRender ? "demand" : "always"
        }
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 55, near: 0.1, far: 500, position: [0, 0, -46] }}
      >
        <InvalidateOnDemand enabled={pageVisible && demandRender} />
        <ContextLossSignal onContextLost={onContextLost} />
        <ambientLight intensity={0.07} />
        <directionalLight position={[-14, 5, -9]} intensity={0.12} color={getSpaceColor("planet-cream")} />
        <directionalLight position={[10, -4, 6]} intensity={0.04} color={getSpaceColor("nebula-blue")} />
        <Nebula />
        <DustClouds />
        <DeepSkyGalaxy />
        <Stars />
        <AsteroidBelt />
        <OpeningSystemOffset>
        <PlanetarySystem onTexturesReady={markPlanetTexturesReady} />
        </OpeningSystemOffset>
        <Comet />
        <AccretionDisk />
        <ShootingStar />
        <OpeningSystemOffset>
          <Planet position={SATURN_POSITION} radius={2.72} />
        </OpeningSystemOffset>
        <Earth
          position={[4, 0.5, 138]}
          radius={5.5}
          onTexturesReady={markEarthTexturesReady}
        />
        <SurveySatellite />
        <SpaceCamera />
        <ReadySignal
          onReady={onReady}
          assetsReady={planetTexturesReady && earthTexturesReady}
          keepRendering={demandRender}
        />
      </Canvas>
    </div>
  );
}
