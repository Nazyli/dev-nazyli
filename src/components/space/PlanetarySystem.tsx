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
  atmosphere: SpaceColorToken | null;
  station: number;
  side: -1 | 1;
  elevation: number;
  tilt: number;
  spin: number;
  bumpScale: number;
  cloudOpacity?: number;
  rings?: boolean;
};

type MoonSpec = {
  name: string;
  host: string;
  radius: number;
  orbitRadius: number;
  inclination: number;
  phase: number;
  angularSpeed: number;
  palette: [SpaceColorToken, SpaceColorToken, SpaceColorToken];
};

const PLANETS: PlanetSpec[] = [
  {
    name: "Mercury",
    radius: 1.1,
    surface: "rocky",
    palette: ["planet-basalt", "planet-lunar", "planet-cream"],
    atmosphere: null,
    station: 1,
    side: -1,
    elevation: -0.68,
    tilt: 0.04,
    spin: 0.018,
    bumpScale: 0.025,
  },
  {
    name: "Venus",
    radius: 1.55,
    surface: "clouded",
    palette: ["planet-tan", "planet-cream", "planet-cloud"],
    atmosphere: "planet-cream",
    station: 2,
    side: 1,
    elevation: 0.68,
    tilt: 0.12,
    spin: -0.012,
    bumpScale: 0.018,
    cloudOpacity: 0.4,
  },
  {
    name: "Mars",
    radius: 1.25,
    surface: "rocky",
    palette: ["planet-rust", "planet-ochre", "planet-sand"],
    atmosphere: "planet-rust",
    station: 3,
    side: -1,
    elevation: 0.68,
    tilt: 0.32,
    spin: 0.022,
    bumpScale: 0.03,
  },
  {
    name: "Jupiter",
    radius: 3.1,
    surface: "banded",
    palette: ["planet-tan", "planet-cream", "planet-rust"],
    atmosphere: "planet-tan",
    station: 4,
    side: 1,
    elevation: -0.68,
    tilt: 0.08,
    spin: 0.028,
    bumpScale: 0.012,
    cloudOpacity: 0.16,
  },
  {
    name: "Uranus",
    radius: 2.05,
    surface: "icy",
    palette: ["planet-ice", "planet-aqua", "planet-cloud"],
    atmosphere: "planet-ice",
    station: 5,
    side: -1,
    elevation: -0.68,
    tilt: 1.3,
    spin: -0.016,
    bumpScale: 0.008,
    cloudOpacity: 0.14,
    rings: true,
  },
  {
    name: "Neptune",
    radius: 2.35,
    surface: "stormy",
    palette: ["planet-ocean", "planet-cobalt", "planet-aqua"],
    atmosphere: "planet-cobalt",
    station: 6,
    side: 1,
    elevation: 0.68,
    tilt: 0.5,
    spin: 0.018,
    bumpScale: 0.012,
    cloudOpacity: 0.2,
  },
];

const URANUS_RINGS = [
  { inner: 1.42, outer: 1.58, color: "planet-lunar", opacity: 0.24 },
  { inner: 1.62, outer: 1.72, color: "planet-basalt", opacity: 0.2 },
  { inner: 1.76, outer: 1.92, color: "planet-cream", opacity: 0.14 },
] as const;

const MOONS: MoonSpec[] = [
  {
    name: "Io",
    host: "Jupiter",
    radius: 0.34,
    orbitRadius: 4.15,
    inclination: 0.08,
    phase: 0.42,
    angularSpeed: 0.074,
    palette: ["planet-ochre", "planet-sand", "planet-cream"],
  },
  {
    name: "Europa",
    host: "Jupiter",
    radius: 0.3,
    orbitRadius: 5.25,
    inclination: -0.12,
    phase: 2.3,
    angularSpeed: 0.052,
    palette: ["planet-cream", "planet-ice", "planet-lunar"],
  },
  {
    name: "Ganymede",
    host: "Jupiter",
    radius: 0.42,
    orbitRadius: 6.7,
    inclination: 0.16,
    phase: 4.1,
    angularSpeed: 0.036,
    palette: ["planet-basalt", "planet-lunar", "planet-ice"],
  },
  {
    name: "Callisto",
    host: "Jupiter",
    radius: 0.37,
    orbitRadius: 8.35,
    inclination: -0.05,
    phase: 5.5,
    angularSpeed: 0.022,
    palette: ["planet-basalt", "planet-tan", "planet-lunar"],
  },
  {
    name: "Titania",
    host: "Uranus",
    radius: 0.24,
    orbitRadius: 3.15,
    inclination: 1.42,
    phase: 1.3,
    angularSpeed: 0.045,
    palette: ["planet-ice", "planet-lunar", "planet-cloud"],
  },
  {
    name: "Oberon",
    host: "Uranus",
    radius: 0.22,
    orbitRadius: 4.05,
    inclination: 1.5,
    phase: 3.7,
    angularSpeed: 0.032,
    palette: ["planet-basalt", "planet-ice", "planet-lunar"],
  },
  {
    name: "Triton",
    host: "Neptune",
    radius: 0.29,
    orbitRadius: 3.7,
    inclination: 0.48,
    phase: 5.2,
    angularSpeed: -0.04,
    palette: ["planet-ice", "planet-aqua", "planet-cloud"],
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
      uIntensity: { value: 0.16 },
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
  moons,
  moonTextures,
}: {
  spec: PlanetSpec;
  textures: PlanetSurfaceTextures;
  moons: MoonSpec[];
  moonTextures: Record<string, PlanetSurfaceTextures>;
}) {
  const body = useRef<THREE.Mesh>(null);
  const cloudLayer = useRef<THREE.Mesh>(null);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const position = useMemo(() => getRoutePosition(spec, aspect), [aspect, spec]);
  const atmosphere = useMemo(
    () => spec.atmosphere ? makeAtmosphere(spec.atmosphere) : null,
    [spec.atmosphere],
  );

  useEffect(() => () => atmosphere?.dispose(), [atmosphere]);

  useFrame((_, delta) => {
    if (universeState.reducedMotion || universeState.ambientMotionPaused) return;
    if (body.current) body.current.rotation.y += delta * spec.spin;
    if (cloudLayer.current) cloudLayer.current.rotation.y += delta * spec.spin * 1.18;
  });

  return (
    <group position={position} rotation={[spec.tilt, 0, 0]}>
      <mesh ref={body}>
        <sphereGeometry args={[spec.radius, 64, 48]} />
        <meshStandardMaterial
          map={textures.color}
          bumpMap={textures.height}
          bumpScale={spec.bumpScale}
          roughness={0.96}
          metalness={0}
        />
      </mesh>
      {textures.clouds && (
        <mesh ref={cloudLayer} scale={1.012}>
          <sphereGeometry args={[spec.radius, 48, 36]} />
          <meshStandardMaterial
            map={textures.clouds}
            transparent
            opacity={spec.cloudOpacity ?? 0.24}
            depthWrite={false}
            roughness={1}
            metalness={0}
          />
        </mesh>
      )}
      {atmosphere && (
        <mesh scale={1.045} material={atmosphere}>
          <sphereGeometry args={[spec.radius, 48, 36]} />
        </mesh>
      )}
      {spec.rings && (
          <group rotation={[Math.PI / 2, 0, 0]}>
            {URANUS_RINGS.map((ring) => (
              <mesh key={ring.inner}>
                <ringGeometry
                  args={[spec.radius * ring.inner, spec.radius * ring.outer, 128, 4]}
                />
                <meshStandardMaterial
                  color={getSpaceColor(ring.color)}
                  transparent
                  opacity={ring.opacity}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  roughness={0.92}
                  metalness={0}
                />
              </mesh>
            ))}
          </group>
      )}
      {moons.map((moon) => (
        <NaturalSatellite
          key={moon.name}
          spec={moon}
          textures={moonTextures[moon.name]}
        />
      ))}
    </group>
  );
}

function NaturalSatellite({
  spec,
  textures,
}: {
  spec: MoonSpec;
  textures: PlanetSurfaceTextures;
}) {
  const orbit = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (
      universeState.reducedMotion ||
      universeState.ambientMotionPaused ||
      !orbit.current
    ) return;
    orbit.current.rotation.y += delta * spec.angularSpeed;
  });

  return (
    <group rotation={[spec.inclination, 0, spec.phase]}>
      <group ref={orbit}>
        <mesh position={[spec.orbitRadius, 0, 0]}>
          <sphereGeometry args={[spec.radius, 32, 24]} />
          <meshStandardMaterial
            map={textures.color}
            bumpMap={textures.height}
            bumpScale={0.018}
            roughness={0.98}
            metalness={0}
          />
        </mesh>
      </group>
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
  const moonTextures = useMemo(
    () => Object.fromEntries(
      MOONS.map((moon, index) => [
        moon.name,
        makePlanetSurfaceTextures("rocky", 41003 + index * 1543, moon.palette),
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
      Object.values(moonTextures).forEach((surface) => {
        surface.color.dispose();
        surface.height.dispose();
      });
    },
    [moonTextures, textures],
  );

  return (
    <group>
      {PLANETS.map((spec) => (
        <CelestialPlanet
          key={spec.name}
          spec={spec}
          textures={textures[spec.name]}
          moons={MOONS.filter((moon) => moon.host === spec.name)}
          moonTextures={moonTextures}
        />
      ))}
    </group>
  );
}
