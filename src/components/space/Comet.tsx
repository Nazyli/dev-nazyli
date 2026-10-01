"use client";

import * as THREE from "three";
import { getSpaceColor } from "@/lib/spaceColors";

export function Comet() {
  return (
    <group position={[8, -11, 68]} rotation={[0.12, -0.24, 0.16]}>
      <mesh>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshBasicMaterial color={getSpaceColor("starlight")} />
      </mesh>
      <mesh position={[-3.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.18, 6.4, 10, 1, true]} />
        <meshBasicMaterial
          color={getSpaceColor("gold-muted")}
          transparent
          opacity={0.16}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
