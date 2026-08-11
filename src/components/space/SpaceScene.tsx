"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { supportsWebGL } from "@/lib/webgl";
import { AccretionDisk } from "./AccretionDisk";
import { DustClouds } from "./DustClouds";
import { Earth } from "./Earth";
import { Nebula } from "./Nebula";
import { Planet } from "./Planet";
import { ShootingStar } from "./ShootingStar";
import { SpaceCamera } from "./SpaceCamera";
import { Stars } from "./Stars";

function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frame = useRef(0);
  const fired = useRef(false);

  useFrame(() => {
    frame.current += 1;
    if (frame.current >= 3 && !fired.current) {
      fired.current = true;
      onReady?.();
    }
  });

  return null;
}

export function SpaceScene({ onReady }: { onReady?: () => void }) {
  const webgl = useMemo(() => supportsWebGL(), []);

  if (!webgl) {
    return (
      <div aria-hidden="true" className="star-map-fallback fixed inset-0 z-0" />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
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
        <Planet position={[3.4, 0.8, -21]} radius={2} />
        <Earth position={[0, 2.2, 32]} radius={5.5} />
        <SpaceCamera />
        <ReadySignal onReady={onReady} />
      </Canvas>
    </div>
  );
}
