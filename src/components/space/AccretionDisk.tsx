"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { makeAccretionDiskTexture, makePhotonRingTexture } from "@/lib/textures";
import { getSpaceColor } from "@/lib/spaceColors";

const INNER = 1.4;
const OUTER = 6.0;

export function AccretionDisk({
  position = [8, -3.2, -31] as [number, number, number],
  rotation = [1.02, 0.06, 0.015] as [number, number, number],
}) {
  const spin = useRef<THREE.Group>(null);
  const map = useMemo(() => makeAccretionDiskTexture(), []);
  const photonRing = useMemo(() => makePhotonRingTexture(), []);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const compactLayout = THREE.MathUtils.clamp((1.35 - aspect) / 0.65, 0, 1);

  useEffect(
    () => () => {
      map.dispose();
      photonRing.dispose();
    },
    [map, photonRing],
  );

  useFrame((_, delta) => {
    if (
      universeState.reducedMotion ||
      universeState.ambientMotionPaused ||
      !spin.current
    ) return;
    spin.current.rotation.z += delta * 0.06;
  });

  return (
    <group
      position={[
        THREE.MathUtils.lerp(position[0], 2.4, compactLayout),
        THREE.MathUtils.lerp(position[1], -4.5, compactLayout),
        position[2],
      ]}
      rotation={rotation}
      scale={THREE.MathUtils.lerp(0.4, 0.3, compactLayout)}
    >
      <group ref={spin}>
        <mesh>
          <ringGeometry args={[INNER, OUTER, 96, 48]} />
          <meshBasicMaterial
            map={map}
            transparent
            opacity={0.74}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh position={[0, 0, -0.12]}>
          <ringGeometry args={[1.24, 2.05, 128, 48]} />
          <meshBasicMaterial
            map={photonRing}
            transparent
            opacity={0.88}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.32, 48, 32]} />
          <meshBasicMaterial color={getSpaceColor("void")} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
