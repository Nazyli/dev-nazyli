"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_POSITION_STOPS,
  CAMERA_TARGET_STOPS,
  cameraPath,
  cameraTargetPath,
} from "@/lib/cameraPath";
import { universeState } from "@/lib/universeState";
import {
  makePlanetSurfaceTextures,
  type PlanetSurfaceStyle,
  type PlanetSurfaceTextures,
} from "@/lib/planetaryTextures";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";

type PlanetSpec = {
  name: string;
  radius: number;
  surface: PlanetSurfaceStyle;
  palette: [SpaceColorToken, SpaceColorToken, SpaceColorToken];
  atmosphere: SpaceColorToken;
  station: number;
  side: -1 | 1;
  elevation: number;
  tilt: number;
  spin: number;
  bumpScale: number;
  cloudOpacity?: number;
  rings?: boolean;
};

const PLANETS: PlanetSpec[] = [
  {
    name: "Mercury",
    radius: 1.1,
    surface: "rocky",
    palette: ["indigo", "dust", "starlight"],
    atmosphere: "nebula-blue",
    station: 1,
    side: -1,
    elevation: -0.68,
    tilt: 0.04,
    spin: 0.018,
    bumpScale: 0.11,
  },
  {
    name: "Venus",
    radius: 1.55,
    surface: "clouded",
    palette: ["gold-muted", "gold", "starlight"],
    atmosphere: "gold-muted",
    station: 2,
    side: 1,
    elevation: 0.68,
    tilt: 0.12,
    spin: -0.012,
    bumpScale: 0.045,
    cloudOpacity: 0.52,
  },
  {
    name: "Mars",
    radius: 1.25,
    surface: "rocky",
    palette: ["indigo", "gold-muted", "gold"],
    atmosphere: "gold-muted",
    station: 3,
    side: -1,
    elevation: 0.68,
    tilt: 0.32,
    spin: 0.022,
    bumpScale: 0.085,
  },
  {
    name: "Jupiter",
    radius: 3.1,
    surface: "banded",
    palette: ["abyss", "gold-muted", "starlight"],
    atmosphere: "gold-muted",
    station: 4,
    side: 1,
    elevation: -0.68,
    tilt: 0.08,
    spin: 0.028,
    bumpScale: 0.035,
    cloudOpacity: 0.23,
  },
  {
    name: "Uranus",
    radius: 2.05,
    surface: "icy",
    palette: ["nebula-blue", "nebula-teal", "accent"],
    atmosphere: "nebula-teal",
    station: 5,
    side: -1,
    elevation: -0.68,
    tilt: 1.3,
    spin: -0.016,
    bumpScale: 0.025,
    cloudOpacity: 0.2,
    rings: true,
  },
  {
    name: "Neptune",
    radius: 2.35,
    surface: "stormy",
    palette: ["indigo", "nebula-blue", "accent"],
    atmosphere: "nebula-blue",
    station: 6,
    side: 1,
    elevation: 0.68,
    tilt: 0.5,
    spin: 0.018,
    bumpScale: 0.04,
    cloudOpacity: 0.28,
  },
];

function makeAtmosphere(color: SpaceColorToken) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(getSpaceColor(color)) },
      uIntensity: { value: 0.34 },
    },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 uColor;
      uniform float uIntensity;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.2);
        gl_FragColor = vec4(uColor, rim * uIntensity);
      }
    `,
  });
}

function getRoutePosition(spec: PlanetSpec, aspect: number) {
  const position = cameraPath.getPointAt(CAMERA_POSITION_STOPS[spec.station]);
  const target = cameraTargetPath.getPointAt(CAMERA_TARGET_STOPS[spec.station]);
  const forward = target.sub(position).normalize();
  const right = new THREE.Vector3()
    .crossVectors(new THREE.Vector3(0, 1, 0), forward)
    .normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  const distance = 48 + spec.radius * 2;
  const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(55 / 2));
  const horizontalOffset = halfHeight * aspect * 0.92 * spec.side;
  const verticalOffset = halfHeight * spec.elevation;

  return position
    .addScaledVector(forward, distance)
    .addScaledVector(right, horizontalOffset)
    .addScaledVector(up, verticalOffset)
    .toArray() as [number, number, number];
}

function CelestialPlanet({
  spec,
  textures,
}: {
  spec: PlanetSpec;
  textures: PlanetSurfaceTextures;
}) {
  const body = useRef<THREE.Mesh>(null);
  const cloudLayer = useRef<THREE.Mesh>(null);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const position = useMemo(() => getRoutePosition(spec, aspect), [aspect, spec]);
  const atmosphere = useMemo(() => makeAtmosphere(spec.atmosphere), [spec.atmosphere]);

  useEffect(() => () => atmosphere.dispose(), [atmosphere]);

  useFrame((_, delta) => {
    if (universeState.reducedMotion || universeState.ambientMotionPaused) return;
    if (body.current) body.current.rotation.y += delta * spec.spin;
    if (cloudLayer.current) cloudLayer.current.rotation.y += delta * spec.spin * 1.18;
  });

  return (
    <group position={position} rotation={[spec.tilt, 0, 0]}>
      <mesh ref={body}>
        <sphereGeometry args={[spec.radius, 48, 32]} />
        <meshStandardMaterial
          map={textures.color}
          bumpMap={textures.height}
          bumpScale={spec.bumpScale}
          emissive={getSpaceColor("starlight")}
          emissiveMap={textures.color}
          emissiveIntensity={0.12}
          roughness={0.96}
          metalness={0}
        />
      </mesh>
      {textures.clouds && (
        <mesh ref={cloudLayer} scale={1.012}>
          <sphereGeometry args={[spec.radius, 40, 28]} />
          <meshBasicMaterial
            map={textures.clouds}
            color={getSpaceColor("starlight")}
            transparent
            opacity={spec.cloudOpacity ?? 0.24}
            depthWrite={false}
          />
        </mesh>
      )}
      <mesh scale={1.065} material={atmosphere}>
        <sphereGeometry args={[spec.radius, 40, 28]} />
      </mesh>
      {spec.rings && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[spec.radius * 1.42, spec.radius * 1.92, 96, 4]} />
          <meshBasicMaterial
            color={getSpaceColor("dust")}
            transparent
            opacity={0.56}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export function PlanetarySystem() {
  const textures = useMemo(
    () =>
      Object.fromEntries(
        PLANETS.map((spec, index) => [
          spec.name,
          makePlanetSurfaceTextures(spec.surface, 1101 + index * 1301, spec.palette),
        ]),
      ) as Record<string, PlanetSurfaceTextures>,
    [],
  );

  useEffect(
    () => () => {
      Object.values(textures).forEach((surface) => {
        surface.color.dispose();
        surface.height.dispose();
        surface.clouds?.dispose();
      });
    },
    [textures],
  );

  return (
    <group>
      {PLANETS.map((spec) => (
        <CelestialPlanet key={spec.name} spec={spec} textures={textures[spec.name]} />
      ))}
    </group>
  );
}
