"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";

const EARTH_ARRIVAL = 0.9;
const ORBIT_RADIUS = 8.2;

export function SurveySatellite() {
  const orbit = useRef<THREE.Group>(null);
  const downlinkPing = useRef<THREE.Mesh>(null);
  const downlinkMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const downlinkPhase = useRef(0);

  useFrame((_, delta) => {
    if (universeState.reducedMotion || !orbit.current) return;

    const arrival = THREE.MathUtils.clamp(
      (universeState.progress - EARTH_ARRIVAL) / (1 - EARTH_ARRIVAL),
      0,
      1,
    );
    orbit.current.scale.setScalar(arrival);
    orbit.current.rotation.z = Math.PI - 0.55 + arrival * 1.1;

    if (downlinkPing.current && downlinkMaterial.current) {
      if (!universeState.ambientMotionPaused) {
        downlinkPhase.current = (downlinkPhase.current + delta / 3.2) % 1;
      }
      downlinkPing.current.visible = arrival > 0;
      downlinkPing.current.scale.setScalar(0.65 + downlinkPhase.current * 1.8);
      downlinkMaterial.current.opacity = (1 - downlinkPhase.current) * 0.28;
    }
  });

  return (
    <group ref={orbit} position={[7, 12.2, 150]}>
      <mesh ref={downlinkPing} position={[0, 0, -5.54]} visible={false}>
        <ringGeometry args={[0.9, 0.94, 96]} />
        <meshBasicMaterial
          ref={downlinkMaterial}
          color={getSpaceColor("accent")}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[0, 0, 0.18]}>
        <ringGeometry args={[ORBIT_RADIUS - 0.025, ORBIT_RADIUS + 0.025, 96]} />
        <meshBasicMaterial
          color={getSpaceColor("indigo")}
          transparent
          opacity={0.8}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group position={[ORBIT_RADIUS, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.46, 0.42, 0.42]} />
          <meshStandardMaterial color={getSpaceColor("gold")} roughness={0.65} metalness={0.35} />
        </mesh>
        <mesh position={[-0.82, 0, 0]}>
          <boxGeometry args={[1.18, 0.62, 0.06]} />
          <meshStandardMaterial color={getSpaceColor("indigo")} roughness={0.8} metalness={0.15} />
        </mesh>
        <mesh position={[0.82, 0, 0]}>
          <boxGeometry args={[1.18, 0.62, 0.06]} />
          <meshStandardMaterial color={getSpaceColor("indigo")} roughness={0.8} metalness={0.15} />
        </mesh>
        <mesh position={[-0.82, 0, 0.036]}>
          <boxGeometry args={[1.02, 0.025, 0.012]} />
          <meshBasicMaterial color={getSpaceColor("accent")} />
        </mesh>
        <mesh position={[0.82, 0, 0.036]}>
          <boxGeometry args={[1.02, 0.025, 0.012]} />
          <meshBasicMaterial color={getSpaceColor("accent")} />
        </mesh>
      </group>
    </group>
  );
}
