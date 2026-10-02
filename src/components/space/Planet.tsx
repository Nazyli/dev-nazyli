"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";
import { getPlanetaryBodyVisibility } from "@/lib/planetaryTour";
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
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const rings = useRef<THREE.Mesh>(null);
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
    const visibility = universeState.reducedMotion
      ? 1
      : getPlanetaryBodyVisibility(universeState.progress, "Saturn");
    if (group.current) {
      group.current.visible = visibility > 0.001;
      group.current.scale.setScalar(0.72 + visibility * 0.28);
    }
    if (body.current) {
      (body.current.material as THREE.MeshStandardMaterial).opacity = visibility;
    }
    if (rings.current) {
      (rings.current.material as THREE.MeshStandardMaterial).opacity = visibility;
    }
    if (universeState.reducedMotion || universeState.ambientMotionPaused) return;
    if (body.current) {
      body.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group ref={group} position={position} rotation={[-1.08, 0.22, 0]}>
      <mesh ref={body}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={map ?? undefined}
          color={map ? getSpaceColor("starlight") : getSpaceColor("planet-tan")}
          roughness={0.92}
          metalness={0.02}
          transparent
          depthWrite={false}
        />
      </mesh>
      <mesh ref={rings}>
        <ringGeometry args={[radius * 1.32, radius * 1.9, 128]} />
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
