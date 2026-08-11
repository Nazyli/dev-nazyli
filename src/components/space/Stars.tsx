"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DISTANT_COUNT = 1600;
const BRIGHT_COUNT = 60;

function makeStarSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.25)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function randomSpherePositions(
  count: number,
  minRadius: number,
  maxRadius: number,
  out: Float32Array
) {
  for (let i = 0; i < count; i++) {
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const i3 = i * 3;
    out[i3] = radius * Math.sin(phi) * Math.cos(theta);
    out[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    out[i3 + 2] = radius * Math.cos(phi);
  }
}

export function Stars() {
  const group = useRef<THREE.Group>(null);

  const sprite = useMemo(() => makeStarSprite(), []);

  const distantGeometry = useMemo(() => {
    const positions = new Float32Array(DISTANT_COUNT * 3);
    randomSpherePositions(DISTANT_COUNT, 28, 60, positions);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const brightGeometry = useMemo(() => {
    const positions = new Float32Array(BRIGHT_COUNT * 3);
    randomSpherePositions(BRIGHT_COUNT, 28, 60, positions);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.004;
    }
  });

  if (!sprite) return null;

  return (
    <group ref={group}>
      <points geometry={distantGeometry}>
        <pointsMaterial
          map={sprite}
          color="#f5efe0"
          size={0.4}
          sizeAttenuation
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={brightGeometry}>
        <pointsMaterial
          map={sprite}
          color="#d9b36a"
          size={0.85}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
