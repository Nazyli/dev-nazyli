"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type PlanetProps = {
  position: [number, number, number];
  radius?: number;
};

export function Planet({ position, radius = 2 }: PlanetProps) {
  const body = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (body.current) {
      body.current.rotation.y += delta * 0.06;
    }
    if (ring.current) {
      ring.current.rotation.z += delta * 0.03;
    }
  });

  return (
    <group position={position}>
      <mesh ref={body} rotation={[0.4, 0, 0]}>
        <icosahedronGeometry args={[radius, 5]} />
        <meshStandardMaterial
          color="#262b4f"
          roughness={0.85}
          metalness={0.15}
          emissive="#10142b"
          emissiveIntensity={0.6}
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0.2, 0]}>
        <torusGeometry args={[radius * 1.55, 0.03, 8, 96]} />
        <meshStandardMaterial
          color="#d9b36a"
          roughness={0.6}
          metalness={0.4}
          emissive="#8a6d2e"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
}
