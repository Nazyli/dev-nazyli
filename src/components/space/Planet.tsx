"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import {
  PLANET_TEXTURE_URL,
  makePlanetTexture,
  makeRingTexture,
} from "@/lib/textures";

type PlanetProps = {
  position: [number, number, number];
  radius?: number;
};

export function Planet({ position, radius = 2 }: PlanetProps) {
  const body = useRef<THREE.Mesh>(null);

  const map = useMemo(
    () => (PLANET_TEXTURE_URL ? null : makePlanetTexture()),
    []
  );
  const ringMap = useMemo(() => makeRingTexture(), []);

  useEffect(
    () => () => {
      map?.dispose();
      ringMap.dispose();
    },
    [map, ringMap],
  );

  useFrame((_, delta) => {
    if (universeState.reducedMotion || universeState.ambientMotionPaused) return;
    if (body.current) {
      body.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group position={position} rotation={[-1.08, 0.22, 0]}>
      <mesh ref={body}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={map ?? undefined}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>
      <mesh>
        <ringGeometry args={[radius * 1.32, radius * 2.35, 128]} />
        <meshStandardMaterial
          map={ringMap}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}
