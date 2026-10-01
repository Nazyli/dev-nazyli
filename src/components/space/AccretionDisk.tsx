"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { makeAccretionDiskTexture } from "@/lib/textures";
import { getSpaceColor } from "@/lib/spaceColors";

const INNER = 1.4;
const OUTER = 6.0;

export function AccretionDisk({
  position = [-18, 4, -30] as [number, number, number],
  rotation = [0.35, 0.6, 0.12] as [number, number, number],
}) {
  const spin = useRef<THREE.Group>(null);
  const map = useMemo(() => makeAccretionDiskTexture(), []);
  const aspect = useThree((state) => state.size.width / state.size.height);

  useEffect(() => () => map.dispose(), [map]);

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
      position={position}
      rotation={rotation}
      scale={THREE.MathUtils.lerp(
        0.78,
        0.58,
        THREE.MathUtils.clamp((1.1 - aspect) / 0.64, 0, 1),
      )}
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
        <mesh>
          <sphereGeometry args={[1.32, 48, 32]} />
          <meshBasicMaterial color={getSpaceColor("void")} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
