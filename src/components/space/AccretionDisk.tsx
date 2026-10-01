"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const [binaryImage, setBinaryImage] = useState<THREE.Texture | null>(null);
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

  useEffect(() => {
    let active = true;
    const texture = new THREE.TextureLoader().load(
      "/textures/binary-black-hole.png",
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        loadedTexture.needsUpdate = true;
        if (active) setBinaryImage(loadedTexture);
        else loadedTexture.dispose();
      },
    );
    return () => {
      active = false;
      texture.dispose();
    };
  }, []);

  useEffect(() => () => map.dispose(), [map]);
  useEffect(() => () => binaryImage?.dispose(), [binaryImage]);

  useFrame((_, delta) => {
    if (
      universeState.reducedMotion ||
      universeState.ambientMotionPaused ||
      !spin.current
    ) return;
    spin.current.rotation.z += delta * (binaryImage ? 0.012 : 0.06);
  });

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
    >
      <group ref={spin}>
        {binaryImage ? (
          <mesh>
            <planeGeometry args={[OUTER * 2.7, OUTER * 1.8]} />
            <meshBasicMaterial
              map={binaryImage}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ) : (
          <>
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
          </>
        )}
      </group>
    </group>
  );
}
