"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { makeAccretionDiskTexture } from "@/lib/textures";

const INNER = 1.4;
const OUTER = 6.0;

function makeCoreTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function AccretionDisk({
  position = [-14, 4, -30] as [number, number, number],
  rotation = [0.35, 0.6, 0.12] as [number, number, number],
}) {
  const spin = useRef<THREE.Group>(null);
  const map = useMemo(() => makeAccretionDiskTexture(), []);
  const coreTexture = useMemo(() => makeCoreTexture(), []);

  useFrame((_, delta) => {
    if (universeState.reducedMotion || !spin.current) return;
    spin.current.rotation.z += delta * 0.06;
  });

  return (
    <group position={position} rotation={rotation}>
      <group ref={spin}>
        <mesh>
          <ringGeometry args={[INNER, OUTER, 96, 48]} />
          <meshBasicMaterial
            map={map}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
      {coreTexture && (
        <sprite scale={[1.2, 1.2, 1]}>
          <spriteMaterial
            map={coreTexture}
            color="#c2a06a"
            transparent
            opacity={0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      )}
    </group>
  );
}
