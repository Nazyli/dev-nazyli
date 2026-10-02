"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";
import { makePlanetTexture, makeRingTexture } from "@/lib/textures";
import {
  disposeGeneratedTexture,
  loadPlanetImageTexture,
} from "@/lib/planetaryTextures";

type PlanetProps = {
  position: [number, number, number];
  radius?: number;
};

export function Planet({ position, radius = 2 }: PlanetProps) {
  const body = useRef<THREE.Mesh>(null);
  const [map, setMap] = useState<THREE.Texture | null>(null);
  const ringMap = useMemo(() => makeRingTexture(), []);

  useEffect(() => {
    let disposed = false;
    let generatedMap: THREE.Texture | null = null;
    void loadPlanetImageTexture("/textures/planetary/2k_saturn.webp")
      .then((texture) => {
        if (!disposed) setMap(texture);
      })
      .catch(() => {
        generatedMap = makePlanetTexture();
        if (disposed) {
          disposeGeneratedTexture(generatedMap);
        } else {
          setMap(generatedMap);
        }
      });
    return () => {
      disposed = true;
      disposeGeneratedTexture(generatedMap);
      ringMap.dispose();
    };
  }, [ringMap]);

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
          color={map ? getSpaceColor("starlight") : getSpaceColor("planet-tan")}
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
