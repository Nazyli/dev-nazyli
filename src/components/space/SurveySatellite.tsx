"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";

const EARTH_ARRIVAL = 0.9;
const ORBIT_RADIUS = 8.2;

export function SurveySatellite() {
  const orbit = useRef<THREE.Group>(null);

  useFrame(() => {
    if (universeState.reducedMotion || !orbit.current) return;

    const arrival = THREE.MathUtils.clamp(
      (universeState.progress - EARTH_ARRIVAL) / (1 - EARTH_ARRIVAL),
      0,
      1,
    );
    orbit.current.scale.setScalar(arrival);
    orbit.current.rotation.z = Math.PI - 0.55 + arrival * 1.1;
  });

  return (
    <group ref={orbit} position={[7, 12.2, 150]}>
      <mesh rotation={[0, 0, 0.18]}>
        <ringGeometry args={[ORBIT_RADIUS - 0.025, ORBIT_RADIUS + 0.025, 96]} />
        <meshBasicMaterial
          color="#1e213f"
          transparent
          opacity={0.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group position={[ORBIT_RADIUS, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.46, 0.42, 0.42]} />
          <meshStandardMaterial color="#d9b36a" roughness={0.65} metalness={0.35} />
        </mesh>
        <mesh position={[-0.82, 0, 0]}>
          <boxGeometry args={[1.18, 0.62, 0.06]} />
          <meshStandardMaterial color="#1e213f" roughness={0.8} metalness={0.15} />
        </mesh>
        <mesh position={[0.82, 0, 0]}>
          <boxGeometry args={[1.18, 0.62, 0.06]} />
          <meshStandardMaterial color="#1e213f" roughness={0.8} metalness={0.15} />
        </mesh>
        <mesh position={[-0.82, 0, 0.036]}>
          <boxGeometry args={[1.02, 0.025, 0.012]} />
          <meshBasicMaterial color="#66d9e8" />
        </mesh>
        <mesh position={[0.82, 0, 0.036]}>
          <boxGeometry args={[1.02, 0.025, 0.012]} />
          <meshBasicMaterial color="#66d9e8" />
        </mesh>
      </group>
    </group>
  );
}
