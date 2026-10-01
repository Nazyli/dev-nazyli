"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { createSeededRandom } from "@/lib/random";
import { cameraPath } from "@/lib/cameraPath";
import { getSpaceColor } from "@/lib/spaceColors";

const DISTANT_COUNT = 1100;
const BRIGHT_COUNT = 36;
const GALAXY_COUNT = 700;
const starfieldPosition = cameraPath.getPointAt(0);

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
  out: Float32Array,
  random: () => number,
) {
  for (let i = 0; i < count; i++) {
    const radius = minRadius + random() * (maxRadius - minRadius);
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const i3 = i * 3;
    out[i3] = radius * Math.sin(phi) * Math.cos(theta);
    out[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    out[i3 + 2] = radius * Math.cos(phi);
  }
}

function randomDiscPositions(
  count: number,
  out: Float32Array,
  random: () => number,
) {
  for (let i = 0; i < count; i++) {
    const radius = 30 + random() * 32;
    const theta = random() * Math.PI * 2;
    const i3 = i * 3;
    out[i3] = radius * Math.cos(theta);
    out[i3 + 1] = (random() - 0.5) * 1.4;
    out[i3 + 2] = radius * Math.sin(theta);
  }
}

export function Stars() {
  const group = useRef<THREE.Group>(null);

  const sprite = useMemo(() => makeStarSprite(), []);

  useEffect(() => () => sprite?.dispose(), [sprite]);

  const distantGeometry = useMemo(() => {
    const positions = new Float32Array(DISTANT_COUNT * 3);
    randomSpherePositions(
      DISTANT_COUNT,
      28,
      60,
      positions,
      createSeededRandom(10101),
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const brightGeometry = useMemo(() => {
    const positions = new Float32Array(BRIGHT_COUNT * 3);
    randomSpherePositions(
      BRIGHT_COUNT,
      28,
      60,
      positions,
      createSeededRandom(20202),
    );
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const galaxyGeometry = useMemo(() => {
    const positions = new Float32Array(GALAXY_COUNT * 3);
    randomDiscPositions(GALAXY_COUNT, positions, createSeededRandom(30303));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.position.copy(state.camera.position);
      if (!universeState.reducedMotion && !universeState.ambientMotionPaused) {
        group.current.rotation.y += delta * 0.004;
      }
    }
  });

  if (!sprite) return null;

  return (
    <group ref={group} position={starfieldPosition}>
      <points geometry={distantGeometry}>
        <pointsMaterial
          map={sprite}
          color={getSpaceColor("starlight")}
          size={0.5}
          sizeAttenuation
          transparent
          opacity={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={brightGeometry}>
        <pointsMaterial
          map={sprite}
          color={getSpaceColor("gold")}
          size={0.95}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points geometry={galaxyGeometry} rotation={[0.6, 0, 0]}>
        <pointsMaterial
          map={sprite}
          color={getSpaceColor("starlight")}
          size={0.3}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
