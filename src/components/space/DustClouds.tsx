"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { createSeededRandom } from "@/lib/random";

const COUNT = 700;

type Cluster = {
  x: number;
  y: number;
  z: number;
  spread: number;
};

const CLUSTERS: Cluster[] = [
  { x: -12, y: 0, z: -30, spread: 12 },
  { x: 16, y: -2, z: -20, spread: 10 },
  { x: -8, y: 4, z: -2, spread: 11 },
  { x: 12, y: 2, z: 14, spread: 9 },
  { x: 0, y: 3, z: 26, spread: 8 },
];

function gauss(random: () => number) {
  return (random() + random() + random()) / 3 - 0.5;
}

function makeDustGeometry(): THREE.BufferGeometry {
  const random = createSeededRandom(424242);
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const c = CLUSTERS[Math.floor(random() * CLUSTERS.length)];
    const i3 = i * 3;
    positions[i3] = c.x + gauss(random) * c.spread;
    positions[i3 + 1] = c.y + gauss(random) * c.spread * 0.6;
    positions[i3 + 2] = c.z + gauss(random) * c.spread * 0.8;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geometry;
}

function makeDustSprite(): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function DustClouds() {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => makeDustGeometry(), []);
  const sprite = useMemo(() => makeDustSprite(), []);

  useFrame((_, delta) => {
    if (universeState.reducedMotion || !group.current) return;
    group.current.rotation.y += delta * 0.01;
  });

  if (!sprite) return null;

  return (
    <group ref={group}>
      <points geometry={geometry}>
        <pointsMaterial
          map={sprite}
          color="#2a4a5c"
          size={1.6}
          sizeAttenuation
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
