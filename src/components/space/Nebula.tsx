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

const FAR_CLOUDS: CloudDef[] = [
  { position: [-12, 4, 42], scale: 50, texture: 1, color: "nebula-violet", opacity: 0.11 },
  { position: [18, -6, 48], scale: 60, texture: 0, color: "nebula-blue", opacity: 0.13 },
  { position: [-16, 10, 58], scale: 64, texture: 2, color: "nebula-teal", opacity: 0.12 },
  { position: [6, 12, 72], scale: 62, texture: 1, color: "nebula-violet", opacity: 0.11 },
  { position: [-20, -8, 86], scale: 66, texture: 0, color: "nebula-blue", opacity: 0.11 },
  { position: [14, 8, 100], scale: 64, texture: 2, color: "nebula-teal", opacity: 0.1 },
  { position: [-8, -10, 114], scale: 62, texture: 1, color: "nebula-violet", opacity: 0.1 },
  { position: [20, 4, 128], scale: 60, texture: 0, color: "nebula-blue", opacity: 0.1 },
  { position: [-18, 8, 142], scale: 66, texture: 2, color: "nebula-teal", opacity: 0.09 },
  { position: [14, 8, 150], scale: 55, texture: 2, color: "nebula-teal", opacity: 0.1 },
  { position: [-14, -4, 152], scale: 58, texture: 0, color: "nebula-blue", opacity: 0.1 },
  { position: [4, -8, 156], scale: 64, texture: 1, color: "nebula-violet", opacity: 0.09 },
  { position: [-4, -13, 166], scale: 62, texture: 2, color: "nebula-teal", opacity: 0.09 },
  { position: [-6, 14, 168], scale: 62, texture: 0, color: "nebula-blue", opacity: 0.08 },
  { position: [-24, 6, 168], scale: 70, texture: 2, color: "nebula-teal", opacity: 0.09 },
  { position: [24, 0, 170], scale: 70, texture: 0, color: "nebula-blue", opacity: 0.09 },
  { position: [2, 18, 176], scale: 65, texture: 1, color: "nebula-violet", opacity: 0.08 },
  { position: [0, 4, 182], scale: 85, texture: 1, color: "nebula-violet", opacity: 0.11 },
  { position: [-8, 26, 42], scale: 52, texture: 2, color: "nebula-teal", opacity: 0.16 },
  { position: [8, 20, 52], scale: 58, texture: 0, color: "nebula-blue", opacity: 0.14 },
  { position: [-18, 12, 58], scale: 62, texture: 1, color: "nebula-violet", opacity: 0.12 },
  { position: [-8, 2, 132], scale: 70, texture: 0, color: "nebula-blue", opacity: 0.13 },
  { position: [12, 10, 146], scale: 78, texture: 2, color: "nebula-teal", opacity: 0.19 },
  { position: [-16, -10, 154], scale: 82, texture: 1, color: "nebula-violet", opacity: 0.17 },
  { position: [0, 8, 150], scale: 76, texture: 0, color: "nebula-blue", opacity: 0.16 },
  { position: [-6, 22, 48], scale: 54, texture: 1, color: "nebula-violet", opacity: 0.1 },
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

const FAR_EMISSION: CloudDef[] = [
  { position: [10, 2, 64], scale: 40, texture: 2, color: "gold", opacity: 0.04 },
  { position: [-14, -2, 96], scale: 38, texture: 0, color: "accent", opacity: 0.045 },
  { position: [8, 10, 130], scale: 38, texture: 1, color: "gold", opacity: 0.04 },
  { position: [-8, -2, 158], scale: 38, texture: 0, color: "accent", opacity: 0.04 },
  { position: [0, 4, 160], scale: 40, texture: 0, color: "accent", opacity: 0.04 },
  { position: [0, 6, 172], scale: 42, texture: 1, color: "gold", opacity: 0.045 },
  { position: [-8, 26, 50], scale: 48, texture: 2, color: "nebula-teal", opacity: 0.075 },
  { position: [8, 8, 160], scale: 54, texture: 1, color: "nebula-violet", opacity: 0.085 },
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
  const nearGroup = useRef<THREE.Group>(null);

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
      !nearGroup.current
    ) return;
    const t = state.clock.elapsedTime;
    const textureDrift = [-0.012, 0.008, -0.006];
    cloudTextures.forEach((texture, index) => {
      texture.offset.x = (t * textureDrift[index] + 1) % 1;
    });
    nearGroup.current.position.x = THREE.MathUtils.damp(
      nearGroup.current.position.x,
      universeState.mouseX * 2.4 + Math.sin(t * 0.13) * 0.58,
      3,
      delta,
    );
    nearGroup.current.position.y = THREE.MathUtils.damp(
      nearGroup.current.position.y,
      universeState.mouseY * 1.5 + Math.sin(t * 0.09) * 0.36,
      3,
      delta,
    );
    nearGroup.current.rotation.y += delta * 0.02;
    nearGroup.current.rotation.z = Math.sin(t * 0.065) * 0.022;
    nearGroup.current.scale.setScalar(1 + Math.sin(t * 0.16) * 0.035);
  });

  return (
    <>
    <group ref={nearGroup}>
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
      <group>
        {FAR_CLOUDS.map((c, i) => (
          <sprite
            key={`far-cloud-${i}`}
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
        {FAR_EMISSION.map((c, i) => (
          <sprite
            key={`far-emission-${i}`}
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
    </>
  );
}
