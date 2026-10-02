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

type StarTwinkleData = {
  phases: Float32Array;
  frequencies: Float32Array;
  baseColors: Float32Array;
};

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
    const phases = new Float32Array(BRIGHT_COUNT);
    const frequencies = new Float32Array(BRIGHT_COUNT);
    const baseColors = new Float32Array(BRIGHT_COUNT * 3);
    const random = createSeededRandom(20202);
    randomSpherePositions(BRIGHT_COUNT, 28, 60, positions, random);

    const cool = new THREE.Color(getSpaceColor("planet-ice"));
    const warm = new THREE.Color(getSpaceColor("starlight"));
    const tint = new THREE.Color();
    for (let index = 0; index < BRIGHT_COUNT; index += 1) {
      const i3 = index * 3;
      tint.copy(cool).lerp(warm, 0.25 + random() * 0.65);
      const brightness = 0.7 + random() * 0.3;
      baseColors[i3] = tint.r * brightness;
      baseColors[i3 + 1] = tint.g * brightness;
      baseColors[i3 + 2] = tint.b * brightness;
      phases[index] = random() * Math.PI * 2;
      frequencies[index] = 0.45 + random() * 1.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(baseColors.slice(), 3));
    geometry.userData.twinkle = { phases, frequencies, baseColors } satisfies StarTwinkleData;
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
      group.current.position.copy(state.camera.position).multiplyScalar(0.82);
      if (!universeState.reducedMotion && !universeState.ambientMotionPaused) {
        group.current.rotation.y += delta * 0.004;
      }
    }

    if (!universeState.reducedMotion && !universeState.ambientMotionPaused) {
      const twinkle = brightGeometry.userData.twinkle as StarTwinkleData;
      const colors = brightGeometry.getAttribute("color");
      const colorArray = colors.array as Float32Array;
      const time = state.clock.elapsedTime;
      for (let index = 0; index < BRIGHT_COUNT; index += 1) {
        const i3 = index * 3;
        const wave = 0.5 + Math.sin(time * twinkle.frequencies[index] + twinkle.phases[index]) * 0.5;
        const brightness = 0.58 + wave * 0.42;
        colorArray[i3] = twinkle.baseColors[i3] * brightness;
        colorArray[i3 + 1] = twinkle.baseColors[i3 + 1] * brightness;
        colorArray[i3 + 2] = twinkle.baseColors[i3 + 2] * brightness;
      }
      colors.needsUpdate = true;
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
          vertexColors
          size={10}
          sizeAttenuation={false}
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
      <points geometry={brightGeometry}>
        <pointsMaterial
          map={sprite}
          color={getSpaceColor("gold")}
          size={1.05}
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
