"use client";

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { Earth } from "./Earth";
import { Planet } from "./Planet";
import { ShootingStar } from "./ShootingStar";
import { SpaceCamera } from "./SpaceCamera";
import { Stars } from "./Stars";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}

export function SpaceScene() {
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
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 6, 8]} intensity={2.5} color="#f5efe0" />
        <Stars />
        <ShootingStar />
        <Planet position={[3.4, 0.8, -21]} radius={2} />
        <Earth position={[0, 2.2, 32]} radius={5.5} />
        <SpaceCamera />
      </Canvas>
    </div>
  );
}
