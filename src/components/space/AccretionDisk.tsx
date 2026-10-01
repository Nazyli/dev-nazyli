"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { makeAccretionDiskTexture } from "@/lib/textures";
import { getSpaceColor } from "@/lib/spaceColors";

const INNER = 1.4;
const OUTER = 6.0;
const POSITION_Z = -24;
const HERO_CAMERA_DISTANCE = 22;
const HERO_FOV = 55;

export function AccretionDisk({
  rotation = [0.82, 0.5, 0.12] as [number, number, number],
}) {
  const spin = useRef<THREE.Group>(null);
  const map = useMemo(() => makeAccretionDiskTexture(), []);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const portrait = THREE.MathUtils.clamp((1.15 - aspect) / 0.7, 0, 1);
  const targetHorizontalPosition = THREE.MathUtils.lerp(0.5, 0.22, portrait);
  const viewHalfWidth =
    HERO_CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(HERO_FOV / 2)) * aspect;
  const position: [number, number, number] = [
    viewHalfWidth * targetHorizontalPosition,
    THREE.MathUtils.lerp(-5.6, 6.5, portrait),
    POSITION_Z,
  ];
  const scale = THREE.MathUtils.lerp(0.68, 0.46, portrait);

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
      scale={scale}
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
        <mesh position={[0, 0, 0.08]}>
          <torusGeometry args={[1.37, 0.035, 8, 96]} />
          <meshBasicMaterial
            color={getSpaceColor("planet-ice")}
            transparent
            opacity={0.78}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.12]}>
          <torusGeometry args={[1.48, 0.025, 8, 96]} />
          <meshBasicMaterial
            color={getSpaceColor("nebula-blue")}
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
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
