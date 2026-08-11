"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DISTANT_COUNT = 1600;
const BRIGHT_COUNT = 60;

function randomSpherePositions(
  count: number,
  minRadius: number,
  maxRadius: number,
  out: Float32Array
) {
  for (let i = 0; i < count; i++) {
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const i3 = i * 3;
    out[i3] = radius * Math.sin(phi) * Math.cos(theta);
    out[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    out[i3 + 2] = radius * Math.cos(phi);
  }
}

export function Stars() {
  const group = useRef<THREE.Group>(null);

  const distantGeometry = useMemo(() => {
    const positions = new Float32Array(DISTANT_COUNT * 3);
    randomSpherePositions(DISTANT_COUNT, 28, 60, positions);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const brightGeometry = useMemo(() => {
    const positions = new Float32Array(BRIGHT_COUNT * 3);
    randomSpherePositions(BRIGHT_COUNT, 28, 60, positions);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.004;
    }
  });

  return (
    <group ref={group}>
      <points geometry={distantGeometry}>
        <pointsMaterial
          color="#f5efe0"
          size={0.3}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
      <points geometry={brightGeometry}>
        <pointsMaterial
          color="#d9b36a"
          size={0.9}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
