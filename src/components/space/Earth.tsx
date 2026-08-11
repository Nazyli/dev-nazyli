"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";

type EarthProps = {
  position?: [number, number, number];
  radius?: number;
};

export function Earth({ position = [0, 2.2, 32], radius = 5.5 }: EarthProps) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);

  useFrame((_, delta) => {
    spin.current += delta * 0.05;
    const tiltX = universeState.mouseY * 0.25;
    const tiltY = universeState.mouseX * 0.4;
    if (group.current) {
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        tiltX,
        3,
        delta
      );
      group.current.rotation.y = spin.current + tiltY;
    }
  });

  return (
    <group position={position}>
      <group ref={group}>
        <mesh rotation={[0.2, 0, 0]}>
          <icosahedronGeometry args={[radius, 6]} />
          <meshStandardMaterial
            color="#1f3f63"
            roughness={0.65}
            metalness={0.15}
            emissive="#0c1626"
            emissiveIntensity={0.5}
          />
        </mesh>
        <mesh scale={1.06}>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshBasicMaterial
            color="#66d9e8"
            transparent
            opacity={0.05}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
