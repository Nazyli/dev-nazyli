"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { makeDustLaneTexture, makeNebulaTexture } from "@/lib/textures";

type CloudDef = {
  position: [number, number, number];
  scale: number;
  texture: number;
  color: string;
  opacity: number;
};

const CLOUDS: CloudDef[] = [
  { position: [-16, 3, -48], scale: 44, texture: 0, color: "#1e2a4a", opacity: 0.3 },
  { position: [20, -5, -40], scale: 38, texture: 1, color: "#12323e", opacity: 0.26 },
  { position: [-26, 7, -30], scale: 40, texture: 2, color: "#1e213f", opacity: 0.22 },
  { position: [14, 9, -16], scale: 34, texture: 0, color: "#12323e", opacity: 0.28 },
  { position: [-12, -8, -6], scale: 30, texture: 1, color: "#1e2a4a", opacity: 0.24 },
  { position: [22, 2, 4], scale: 36, texture: 2, color: "#1e213f", opacity: 0.2 },
  { position: [-18, 6, 14], scale: 32, texture: 0, color: "#12323e", opacity: 0.24 },
  { position: [10, -3, 24], scale: 28, texture: 1, color: "#1e2a4a", opacity: 0.22 },
  { position: [-8, 1, 34], scale: 26, texture: 2, color: "#12323e", opacity: 0.26 },
];

const DUST_LANES: CloudDef[] = [
  { position: [-4, 0, -12], scale: 46, texture: 0, color: "#0b0c1a", opacity: 0.55 },
  { position: [10, 4, 10], scale: 40, texture: 0, color: "#0b0c1a", opacity: 0.5 },
];

const SEEDS = [10101, 20202, 30303];
const LANE_SEED = 424242;

export function Nebula() {
  const group = useRef<THREE.Group>(null);

  const cloudTextures = useMemo(() => SEEDS.map((s) => makeNebulaTexture(s)), []);
  const laneTexture = useMemo(() => makeDustLaneTexture(LANE_SEED), []);

  useFrame((_, delta) => {
    if (universeState.reducedMotion || !group.current) return;
    const damp = (a: number, b: number) => THREE.MathUtils.damp(a, b, 2, delta);
    group.current.position.x = damp(group.current.position.x, universeState.mouseX * 1.4);
    group.current.position.y = damp(group.current.position.y, universeState.mouseY * 0.9);
    group.current.rotation.y += delta * 0.004;
  });

  return (
    <group ref={group}>
      {CLOUDS.map((c, i) => (
        <sprite
          key={`cloud-${i}`}
          position={c.position}
          scale={[c.scale, c.scale, 1]}
        >
          <spriteMaterial
            map={cloudTextures[c.texture]}
            color={c.color}
            transparent
            opacity={c.opacity}
            depthWrite={false}
          />
        </sprite>
      ))}
      {DUST_LANES.map((c, i) => (
        <sprite
          key={`lane-${i}`}
          position={c.position}
          scale={[c.scale, c.scale, 1]}
          renderOrder={1}
        >
          <spriteMaterial
            map={laneTexture}
            color={c.color}
            transparent
            opacity={c.opacity}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}
