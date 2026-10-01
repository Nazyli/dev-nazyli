"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import {
  makeSolarSurfaceTexture,
  makeTerrestrialSurfaceTextures,
  makePlanetSurfaceTextures,
  type PlanetSurfaceStyle,
  type PlanetSurfaceTextures,
} from "@/lib/planetaryTextures";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";
import {
  PLANETARY_TOUR_BODIES,
  type PlanetaryTourBodyName,
  getPlanetaryBodyPosition,
} from "@/lib/planetaryTour";

type PlanetSpec = {
  name: PlanetaryTourBodyName;
  radius: number;
  surface: PlanetSurfaceStyle;
  palette: [SpaceColorToken, SpaceColorToken, SpaceColorToken];
  atmosphere: SpaceColorToken | null;
  tilt: number;
  spin: number;
  bumpScale: number;
  cloudOpacity?: number;
  rings?: "saturn" | "uranus";
  shape?: [number, number, number];
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

const PLANET_VISUALS: Record<PlanetaryTourBodyName, Omit<PlanetSpec, "name">> = {
  Mercury: {
    radius: 1.1,
    surface: "rocky",
    palette: ["planet-basalt", "planet-lunar", "planet-cream"],
    atmosphere: null,
    tilt: 0.04,
    spin: 0.018,
    bumpScale: 0.025,
  },
  Venus: {
    radius: 1.55,
    surface: "clouded",
    palette: ["planet-tan", "planet-cream", "planet-cloud"],
    atmosphere: "planet-cream",
    tilt: 0.12,
    spin: -0.012,
    bumpScale: 0.018,
    cloudOpacity: 0.4,
  },
  Earth: {
    radius: 1.82,
    surface: "clouded",
    palette: ["planet-ocean", "planet-aqua", "planet-cloud"],
    atmosphere: "planet-aqua",
    tilt: 0.22,
    spin: 0.018,
    bumpScale: 0.08,
    cloudOpacity: 0.3,
  },
  Mars: {
    radius: 1.25,
    surface: "rocky",
    palette: ["planet-rust", "planet-ochre", "planet-sand"],
    atmosphere: "planet-rust",
    tilt: 0.32,
    spin: 0.022,
    bumpScale: 0.03,
  },
  Ceres: {
    radius: 0.88,
    surface: "rocky",
    palette: ["planet-basalt", "planet-lunar", "planet-cream"],
    atmosphere: null,
    tilt: 0.36,
    spin: 0.014,
    bumpScale: 0.035,
    shape: [0.9, 0.78, 0.86],
  },
  Jupiter: {
    radius: 3.1,
    surface: "banded",
    palette: ["planet-tan", "planet-cream", "planet-rust"],
    atmosphere: "planet-tan",
    tilt: 0.08,
    spin: 0.028,
    bumpScale: 0.012,
    cloudOpacity: 0.16,
  },
  Saturn: {
    radius: 2.72,
    surface: "banded",
    palette: ["planet-tan", "planet-cream", "planet-ochre"],
    atmosphere: "planet-tan",
    tilt: 0.1,
    spin: 0.024,
    bumpScale: 0.01,
    cloudOpacity: 0.12,
    rings: "saturn",
  },
  Uranus: {
    radius: 2.05,
    surface: "icy",
    palette: ["planet-ice", "planet-aqua", "planet-cloud"],
    atmosphere: "planet-ice",
    tilt: 1.3,
    spin: -0.016,
    bumpScale: 0.008,
    cloudOpacity: 0.14,
    rings: "uranus",
  },
  Neptune: {
    radius: 2.35,
    surface: "stormy",
    palette: ["planet-ocean", "planet-cobalt", "planet-aqua"],
    atmosphere: "planet-cobalt",
    tilt: 0.5,
    spin: 0.018,
    bumpScale: 0.012,
    cloudOpacity: 0.2,
  },
  Pluto: {
    radius: 0.9,
    surface: "icy",
    palette: ["planet-ocean", "planet-ice", "planet-cloud"],
    atmosphere: "planet-ice",
    tilt: 0.3,
    spin: -0.01,
    bumpScale: 0.018,
    cloudOpacity: 0.08,
  },
  Haumea: {
    radius: 0.72,
    surface: "rocky",
    palette: ["planet-ice", "planet-lunar", "planet-cloud"],
    atmosphere: null,
    tilt: 0.18,
    spin: 0.042,
    bumpScale: 0.025,
    shape: [1.34, 0.72, 0.82],
  },
  Eris: {
    radius: 0.82,
    surface: "icy",
    palette: ["planet-basalt", "planet-ice", "planet-lunar"],
    atmosphere: null,
    tilt: 0.42,
    spin: 0.009,
    bumpScale: 0.02,
  },
};

const PLANETS: PlanetSpec[] = PLANETARY_TOUR_BODIES.map(({ name }) => ({
  name,
  ...PLANET_VISUALS[name],
})).filter((spec) => spec.name !== "Saturn");
const SATURN_POSITION = getPlanetaryBodyPosition(
  "Saturn",
  new THREE.Vector3(),
).toArray() as [number, number, number];



const PLANET_RINGS = {
  saturn: [
    { inner: 1.22, outer: 1.38, color: "planet-lunar", opacity: 0.28 },
    { inner: 1.4, outer: 1.72, color: "planet-cream", opacity: 0.5 },
    { inner: 1.74, outer: 1.82, color: "planet-basalt", opacity: 0.16 },
    { inner: 1.84, outer: 2.05, color: "planet-tan", opacity: 0.38 },
    { inner: 2.08, outer: 2.36, color: "planet-cream", opacity: 0.22 },
  ],
  uranus: [
  { inner: 1.42, outer: 1.58, color: "planet-lunar", opacity: 0.24 },
  { inner: 1.62, outer: 1.72, color: "planet-basalt", opacity: 0.2 },
  { inner: 1.76, outer: 1.92, color: "planet-cream", opacity: 0.14 },
  ],
} as const;

const MOONS: MoonSpec[] = [
  {
    name: "Moon",
    host: "Earth",
    radius: 0.42,
    orbitRadius: 2.65,
    inclination: 0.08,
    phase: 1.8,
    angularSpeed: 0.035,
    palette: ["planet-basalt", "planet-lunar", "planet-ice"],
  },
  {
    name: "Phobos",
    host: "Mars",
    radius: 0.14,
    orbitRadius: 1.75,
    inclination: 0.05,
    phase: 0.6,
    angularSpeed: 0.11,
    palette: ["planet-basalt", "planet-lunar", "planet-rust"],
  },
  {
    name: "Deimos",
    host: "Mars",
    radius: 0.1,
    orbitRadius: 2.25,
    inclination: 0.12,
    phase: 3.1,
    angularSpeed: 0.07,
    palette: ["planet-basalt", "planet-lunar", "planet-sand"],
  },
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
    name: "Titan",
    host: "Saturn",
    radius: 0.36,
    orbitRadius: 4.25,
    inclination: 0.3,
    phase: 4.8,
    angularSpeed: 0.042,
    palette: ["planet-ochre", "planet-tan", "planet-cream"],
  },
  {
    name: "Enceladus",
    host: "Saturn",
    radius: 0.2,
    orbitRadius: 3.1,
    inclination: 0.18,
    phase: 0.9,
    angularSpeed: 0.064,
    palette: ["planet-ice", "planet-cloud", "planet-lunar"],
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
  {
    name: "Charon",
    host: "Pluto",
    radius: 0.24,
    orbitRadius: 1.7,
    inclination: 0.1,
    phase: 0.2,
    angularSpeed: 0.024,
    palette: ["planet-basalt", "planet-lunar", "planet-ice"],
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
  const position = useMemo(
    () => getPlanetaryBodyPosition(spec.name, new THREE.Vector3()).toArray() as [number, number, number],
    [spec.name],
  );
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
      <mesh ref={body} scale={spec.shape ?? 1}>
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
          <group rotation={[spec.rings === "saturn" ? 0.34 : 1.16, 0, 0]}>
            {PLANET_RINGS[spec.rings].map((ring) => (
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

function SolarCore() {
  const surface = useMemo(() => makeSolarSurfaceTexture(912735), []);
  const body = useRef<THREE.Mesh>(null);

  useEffect(() => () => surface.dispose(), [surface]);

  useFrame((_, delta) => {
    if (!universeState.ambientMotionPaused && !universeState.reducedMotion && body.current) {
      body.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <group>
      <pointLight
        color={getSpaceColor("gold")}
        intensity={180}
        distance={180}
        decay={2}
      />
      <mesh ref={body}>
        <sphereGeometry args={[3.2, 64, 48]} />
        <meshBasicMaterial map={surface} toneMapped={false} />
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[3.2, 48, 36]} />
        <meshBasicMaterial
          color={getSpaceColor("gold")}
          transparent
          opacity={0.075}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function OrbitalPaths() {
  const inclination = THREE.MathUtils.degToRad(8);

  return (
    <group rotation={[Math.PI / 2 - inclination, 0, 0]}>
      {PLANETARY_TOUR_BODIES.map((body) => (
        <mesh key={body.name}>
          <torusGeometry args={[body.orbitRadius, 0.012, 4, 256]} />
          <meshBasicMaterial
            color={getSpaceColor("gold-muted")}
            transparent
            opacity={0.12}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function PlanetarySystem() {
  const textures = useMemo(
    () =>
      Object.fromEntries(
        PLANETS.map((spec, index) => [
          spec.name,
          spec.name === "Earth"
            ? makeTerrestrialSurfaceTextures()
            : makePlanetSurfaceTextures(spec.surface, 1101 + index * 1301, spec.palette),
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
      <OrbitalPaths />
      <SolarCore />
      {PLANETS.map((spec) => (
        <CelestialPlanet
          key={spec.name}
          spec={spec}
          textures={textures[spec.name]}
          moons={MOONS.filter((moon) => moon.host === spec.name)}
          moonTextures={moonTextures}
        />
      ))}
      <group position={SATURN_POSITION}>
        {MOONS.filter((moon) => moon.host === "Saturn").map((moon) => (
          <NaturalSatellite
            key={moon.name}
            spec={moon}
            textures={moonTextures[moon.name]}
          />
        ))}
      </group>
    </group>
  );
}
