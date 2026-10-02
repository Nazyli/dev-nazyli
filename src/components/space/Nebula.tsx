"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { makeDustLaneTexture, makeNebulaTexture } from "@/lib/textures";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";

type CloudDef = {
  position: [number, number, number];
  scale: number;
  texture: number;
  color: SpaceColorToken;
  opacity: number;
};

const CLOUDS: CloudDef[] = [
  { position: [-2, 5, -34], scale: 58, texture: 0, color: "nebula-blue", opacity: 0.28 },
  { position: [8, -3, -28], scale: 54, texture: 1, color: "nebula-violet", opacity: 0.25 },
  { position: [-8, -7, -38], scale: 56, texture: 2, color: "nebula-teal", opacity: 0.22 },
  { position: [14, 9, -16], scale: 40, texture: 0, color: "nebula-teal", opacity: 0.12 },
  { position: [-12, -8, -6], scale: 38, texture: 1, color: "nebula-blue", opacity: 0.105 },
  { position: [22, 2, 4], scale: 42, texture: 2, color: "nebula-violet", opacity: 0.1 },
  { position: [-18, 6, 14], scale: 38, texture: 0, color: "nebula-teal", opacity: 0.105 },
  { position: [10, -3, 24], scale: 34, texture: 1, color: "nebula-blue", opacity: 0.095 },
  { position: [-8, 1, 34], scale: 34, texture: 2, color: "nebula-violet", opacity: 0.095 },
];

const DUST_LANES: CloudDef[] = [
  { position: [-4, 0, -12], scale: 46, texture: 0, color: "abyss", opacity: 0.4 },
  { position: [10, 4, 10], scale: 40, texture: 0, color: "abyss", opacity: 0.36 },
];

const EMISSION: CloudDef[] = [
  { position: [-9, -1, -46], scale: 42, texture: 0, color: "nebula-blue", opacity: 0.085 },
  { position: [14, 4, -38], scale: 40, texture: 1, color: "nebula-violet", opacity: 0.09 },
  { position: [-20, 5, -30], scale: 44, texture: 2, color: "nebula-teal", opacity: 0.075 },
  { position: [-12, 2, 12], scale: 40, texture: 0, color: "gold", opacity: 0.045 },
  { position: [8, 6, 18], scale: 36, texture: 1, color: "accent", opacity: 0.05 },
];

const REFLECTION: CloudDef[] = [
  { position: [0, 0, -44], scale: 58, texture: 1, color: "nebula-violet", opacity: 0.095 },
  { position: [8, 3, -44], scale: 40, texture: 1, color: "nebula-blue", opacity: 0.09 },
  { position: [-6, 6, -24], scale: 40, texture: 0, color: "accent", opacity: 0.075 },
  { position: [16, -3, -12], scale: 38, texture: 2, color: "nebula-violet", opacity: 0.085 },
  { position: [2, 5, 6], scale: 38, texture: 1, color: "nebula-teal", opacity: 0.075 },
  { position: [-10, 3, 22], scale: 36, texture: 0, color: "nebula-blue", opacity: 0.07 },
  { position: [4, 2, 30], scale: 40, texture: 2, color: "nebula-violet", opacity: 0.08 },
];

const SEEDS = [10101, 20202, 30303];
const LANE_SEED = 424242;

export function Nebula() {
  const group = useRef<THREE.Group>(null);

  const cloudTextures = useMemo(() => SEEDS.map((s) => makeNebulaTexture(s)), []);
  const laneTexture = useMemo(() => makeDustLaneTexture(LANE_SEED), []);

  useEffect(
    () => () => {
      cloudTextures.forEach((texture) => texture.dispose());
      laneTexture.dispose();
    },
    [cloudTextures, laneTexture],
  );

  useFrame((state, delta) => {
    if (
      universeState.reducedMotion ||
      universeState.ambientMotionPaused ||
      !group.current
    ) return;
    const t = state.clock.elapsedTime;
    const textureDrift = [-0.012, 0.008, -0.006];
    cloudTextures.forEach((texture, index) => {
      texture.offset.x = (t * textureDrift[index] + 1) % 1;
    });
    group.current.position.x = THREE.MathUtils.damp(
      group.current.position.x,
      universeState.mouseX * 2.4 + Math.sin(t * 0.13) * 0.58,
      3,
      delta,
    );
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      universeState.mouseY * 1.5 + Math.sin(t * 0.09) * 0.36,
      3,
      delta,
    );
    group.current.rotation.y += delta * 0.02;
    group.current.rotation.z = Math.sin(t * 0.065) * 0.022;
    group.current.scale.setScalar(1 + Math.sin(t * 0.16) * 0.035);
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
            color={getSpaceColor(c.color)}
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
            color={getSpaceColor(c.color)}
            transparent
            opacity={c.opacity}
            depthWrite={false}
          />
        </sprite>
      ))}
      {EMISSION.map((c, i) => (
        <sprite
          key={`emission-${i}`}
          position={c.position}
          scale={[c.scale, c.scale, 1]}
          renderOrder={2}
        >
          <spriteMaterial
            map={cloudTextures[c.texture]}
            color={getSpaceColor(c.color)}
            transparent
            opacity={c.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
      {REFLECTION.map((c, i) => (
        <sprite
          key={`reflection-${i}`}
          position={c.position}
          scale={[c.scale, c.scale, 1]}
          renderOrder={2}
        >
          <spriteMaterial
            map={cloudTextures[c.texture]}
            color={getSpaceColor(c.color)}
            transparent
            opacity={c.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}
