"use client";

import { useMemo } from "react";
import * as THREE from "three";

const NEBULAE: [number, number, number, number, number][] = [
  [0, 0, -60, 34, 0],
  [28, 12, -34, 24, 1],
  [-26, -10, -42, 28, 0],
  [12, -18, 4, 26, 1],
  [-20, 14, 22, 20, 1],
  [34, 6, 26, 22, 0],
];

function makeCloudTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

export function Nebula() {
  const texture = useMemo(() => makeCloudTexture(), []);
  if (!texture) return null;

  return (
    <group>
      {NEBULAE.map(([x, y, z, size, tone], i) => (
        <sprite key={i} position={[x, y, z]} scale={[size, size, 1]}>
          <spriteMaterial
            map={texture}
            color={tone === 0 ? "#1e2a4a" : "#12323e"}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </sprite>
      ))}
    </group>
  );
}
