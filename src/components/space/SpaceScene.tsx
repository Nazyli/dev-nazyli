"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { AccretionDisk } from "./AccretionDisk";
import { AsteroidBelt } from "./AsteroidBelt";
import { Comet, SidingSpringComet } from "./Comet";
import { DeepSkyGalaxy } from "./DeepSkyGalaxy";
import { DustClouds } from "./DustClouds";
import { Earth } from "./Earth";
import { KuiperBelt } from "./KuiperBelt";
import { OortCloud } from "./OortCloud";
import { JupiterTrojans } from "./JupiterTrojans";
import { Nebula } from "./Nebula";
import { Planet } from "./Planet";
import { PlanetaryOrbitFrame, PlanetarySystem } from "./PlanetarySystem";
import { Meteor } from "./Meteor";
import { ShootingStar } from "./ShootingStar";
import { Supernova } from "./Supernova";
import { SpaceCamera } from "./SpaceCamera";
import { Stars } from "./Stars";
import { SurveySatellite } from "./SurveySatellite";
import { useAmbientMotionPaused } from "@/hooks/useAmbientMotionPaused";
import { getSpaceColor } from "@/lib/spaceColors";
import { OPENING_SYSTEM_Z, getPlanetaryBodyPosition } from "@/lib/planetaryTour";
import * as THREE from "three";

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

function CameraFillLight() {
  const light = useRef<THREE.PointLight>(null);

  useFrame(({ camera }) => {
    light.current?.position.copy(camera.position);
  });

  return (
    <pointLight
      ref={light}
      color={getSpaceColor("starlight")}
      intensity={26}
      distance={90}
      decay={1.6}
    />
  );
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
        <ambientLight intensity={0.1} />
        <directionalLight position={[-14, 5, -9]} intensity={0.12} color={getSpaceColor("planet-cream")} />
        <directionalLight position={[10, -4, 6]} intensity={0.04} color={getSpaceColor("nebula-blue")} />
        <CameraFillLight />
        <Nebula />
        <DustClouds />
        <DeepSkyGalaxy />
        <Stars />
        <AsteroidBelt />
        <KuiperBelt />
        <OortCloud />
        <group position={[0, 0, OPENING_SYSTEM_Z]}>
          <PlanetaryOrbitFrame>
            <PlanetarySystem />
            <JupiterTrojans />
            <Planet position={SATURN_POSITION} radius={2.72} orbitBodyName="Saturn" />
          </PlanetaryOrbitFrame>
        </group>
        <Comet />
        <SidingSpringComet />
        <AccretionDisk />
        <Meteor />
        <ShootingStar />
        <Supernova />
        <Earth
          position={[0, 2.2, 138]}
          radius={5.5}
        >
          <SurveySatellite />
        </Earth>
        <SpaceCamera />
        <ReadySignal
          onReady={onReady}
          keepRendering={demandRender}
        />
      </Canvas>
    </div>
  );
}
