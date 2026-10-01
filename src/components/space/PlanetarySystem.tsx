"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { createSeededRandom } from "@/lib/random";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";

type SurfaceStyle = "rocky" | "clouded" | "banded" | "icy";

type PlanetSpec = {
  name: string;
  position: [number, number, number];
  radius: number;
  surface: SurfaceStyle;
  tone: SpaceColorToken;
  atmosphere?: SpaceColorToken;
  tilt: number;
  spin: number;
};

const PLANETS: PlanetSpec[] = [
  {
    name: "Mercury",
    position: [-4, 9, 10],
    radius: 1.1,
    surface: "rocky",
    tone: "gold-muted",
    tilt: 0.04,
    spin: 0.018,
  },
  {
    name: "Venus",
    position: [4, -8, 23],
    radius: 1.55,
    surface: "clouded",
    tone: "gold-muted",
    atmosphere: "gold-muted",
    tilt: 0.12,
    spin: -0.012,
  },
  {
    name: "Mars",
    position: [-5, 9, 44],
    radius: 1.25,
    surface: "rocky",
    tone: "gold",
    tilt: 0.32,
    spin: 0.022,
  },
  {
    name: "Jupiter",
    position: [0, 12, 70],
    radius: 3.1,
    surface: "banded",
    tone: "gold-muted",
    tilt: 0.08,
    spin: 0.028,
  },
  {
    name: "Uranus",
    position: [5, -12, 92],
    radius: 2.05,
    surface: "icy",
    tone: "accent",
    atmosphere: "nebula-teal",
    tilt: 1.3,
    spin: -0.016,
  },
  {
    name: "Neptune",
    position: [-5, 10, 112],
    radius: 2.35,
    surface: "icy",
    tone: "accent",
    atmosphere: "nebula-blue",
    tilt: 0.5,
    spin: 0.018,
  },
];

const TEXTURE_SIZE = { width: 512, height: 256 };

function makeSurfaceTexture(style: SurfaceStyle, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE.width;
  canvas.height = TEXTURE_SIZE.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2d context unavailable");

  const image = context.createImageData(canvas.width, canvas.height);
  const random = createSeededRandom(seed);
  const offset = random() * Math.PI * 2;

  for (let y = 0; y < canvas.height; y += 1) {
    const v = y / canvas.height;
    for (let x = 0; x < canvas.width; x += 1) {
      const u = x / canvas.width;
      const fineNoise = random() * 0.16;
      let shade = 0.5;

      if (style === "rocky") {
        shade += Math.sin(v * 38 + Math.sin(u * 17 + offset) * 2.2) * 0.13;
        shade += Math.sin(u * 52 + v * 17) * 0.06;
      } else if (style === "clouded") {
        shade += Math.sin(u * 11 + Math.sin(v * 16 + offset) * 1.8) * 0.2;
        shade += Math.cos(v * 27 + u * 8) * 0.08;
      } else if (style === "banded") {
        shade += Math.sin(v * 47 + Math.sin(u * 9 + offset) * 2.6) * 0.2;
        shade += Math.sin(v * 83 + Math.sin(u * 5) * 1.3) * 0.08;
      } else {
        shade += Math.sin(v * 29 + Math.sin(u * 7 + offset) * 1.2) * 0.16;
        shade += Math.cos(v * 13 + u * 4) * 0.08;
      }

      shade = THREE.MathUtils.clamp(shade + fineNoise - 0.08, 0.22, 0.92);
      const value = Math.round(shade * 255);
      const index = (y * canvas.width + x) * 4;
      image.data[index] = value;
      image.data[index + 1] = value;
      image.data[index + 2] = value;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function CelestialPlanet({
  spec,
  texture,
}: {
  spec: PlanetSpec;
  texture: THREE.CanvasTexture;
}) {
  const body = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (
      !body.current ||
      universeState.reducedMotion ||
      universeState.ambientMotionPaused
    ) {
      return;
    }
    body.current.rotation.y += delta * spec.spin;
  });

  return (
    <group position={spec.position} rotation={[spec.tilt, 0, 0]}>
      <mesh ref={body}>
        <sphereGeometry args={[spec.radius, 32, 24]} />
        <meshStandardMaterial
          map={texture}
          color={getSpaceColor(spec.tone)}
          emissive={getSpaceColor(spec.tone)}
          emissiveIntensity={spec.surface === "icy" ? 0.36 : 0.2}
          roughness={0.94}
          metalness={0.01}
        />
      </mesh>
      {spec.atmosphere && (
        <mesh scale={1.045}>
          <sphereGeometry args={[spec.radius, 28, 20]} />
          <meshBasicMaterial
            color={getSpaceColor(spec.atmosphere)}
            transparent
            opacity={0.14}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export function PlanetarySystem() {
  const textures = useMemo(
    () => ({
      rocky: makeSurfaceTexture("rocky", 1201),
      clouded: makeSurfaceTexture("clouded", 2402),
      banded: makeSurfaceTexture("banded", 3603),
      icy: makeSurfaceTexture("icy", 4804),
    }),
    [],
  );

  useEffect(
    () => () => Object.values(textures).forEach((texture) => texture.dispose()),
    [textures],
  );

  return (
    <group>
      {PLANETS.map((spec) => (
        <CelestialPlanet
          key={spec.name}
          spec={spec}
          texture={textures[spec.surface]}
        />
      ))}
    </group>
  );
}
