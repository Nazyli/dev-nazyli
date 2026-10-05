"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import {
  makeSolarSurfaceTexture,
  makeTerrestrialSurfaceTextures,
  makePlanetSurfaceTextures,
  loadPlanetImageSurface,
  loadSolarImageTexture,
  loadPlanetImageTexture,
  PLANET_IMAGE_TEXTURES,
  disposeGeneratedSurfaceTextures,
  disposeGeneratedTexture,
  type PlanetSurfaceStyle,
  type PlanetSurfaceTextures,
} from "@/lib/planetaryTextures";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";
import {
  ORBIT_INCLINATION,
  PLANETARY_TOUR_BODIES,
  type PlanetaryTourBodyName,
  advancePlanetaryOrbit,
  getPlanetaryBodyPosition,
  getPlanetaryBodyVisibility,
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
  rings?: "saturn" | "uranus" | "haumea";
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
    radius: 1.2,
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
    radius: 1.25,
    surface: "icy",
    palette: ["planet-ocean", "planet-ice", "planet-cloud"],
    atmosphere: "planet-ice",
    tilt: 0.3,
    spin: -0.01,
    bumpScale: 0.018,
    cloudOpacity: 0.08,
  },
  Haumea: {
    radius: 1.32,
    surface: "rocky",
    palette: ["planet-ice", "planet-lunar", "planet-cloud"],
    atmosphere: null,
    tilt: 0.18,
    spin: 0.042,
    bumpScale: 0.025,
    shape: [1.34, 0.72, 0.82],
    rings: "haumea",
  },
  Eris: {
    radius: 1.45,
    surface: "icy",
    palette: ["planet-basalt", "planet-ice", "planet-lunar"],
    atmosphere: null,
    tilt: 0.42,
    spin: 0.009,
    bumpScale: 0.02,
  },
  Makemake: {
    radius: 1.3,
    surface: "icy",
    palette: ["planet-rust", "planet-ochre", "planet-cream"],
    atmosphere: null,
    tilt: 0.24,
    spin: 0.012,
    bumpScale: 0.016,
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
  haumea: [
    { inner: 2.54, outer: 2.66, color: "planet-lunar", opacity: 0.34 },
  ],
} as const;

function makeSolarGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const center = 256;
  const glow = context.createRadialGradient(center, center, 0, center, center, center);
  glow.addColorStop(0, "rgba(255, 239, 206, 0.48)");
  glow.addColorStop(0.2, "rgba(255, 211, 151, 0.4)");
  glow.addColorStop(0.48, "rgba(255, 173, 105, 0.22)");
  glow.addColorStop(0.78, "rgba(255, 143, 74, 0.055)");
  glow.addColorStop(1, "rgba(255, 123, 54, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 512, 512);

  context.save();
  context.filter = "blur(7px)";
  for (let index = 0; index < 34; index += 1) {
    const seed = index * 2.399963229728653;
    const start = 0.26 + ((index * 37) % 18) / 100;
    const end = 0.62 + ((index * 53) % 34) / 100;
    const bend = Math.sin(seed * 1.7) * 0.05;
    const angle = seed;
    const startRadius = center * start;
    const endRadius = center * Math.min(end, 0.96);
    const controlRadius = (startRadius + endRadius) * 0.54;
    const alpha = 0.025 + ((index * 29) % 18) / 600;
    const startX = center + Math.cos(angle) * startRadius;
    const startY = center + Math.sin(angle) * startRadius;
    const endX = center + Math.cos(angle + bend * 1.8) * endRadius;
    const endY = center + Math.sin(angle + bend * 1.8) * endRadius;
    const plume = context.createLinearGradient(startX, startY, endX, endY);
    plume.addColorStop(0, "rgba(255, 218, 171, 0)");
    plume.addColorStop(0.18, `rgba(255, 218, 171, ${alpha})`);
    plume.addColorStop(0.72, `rgba(255, 183, 116, ${alpha * 0.58})`);
    plume.addColorStop(1, "rgba(255, 157, 88, 0)");
    context.beginPath();
    context.moveTo(startX, startY);
    context.quadraticCurveTo(
      center + Math.cos(angle + bend) * controlRadius,
      center + Math.sin(angle + bend) * controlRadius,
      endX,
      endY,
    );
    context.strokeStyle = plume;
    context.lineWidth = 3 + ((index * 17) % 12) / 3;
    context.stroke();
  }
  context.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

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
const PROCEDURAL_MOON_TEXTURE_SIZE = { width: 128, height: 64 };

function makeAtmosphere(color: SpaceColorToken) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(getSpaceColor(color)) },
      uIntensity: { value: 0.105 },
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
        float limb = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
        float rim = smoothstep(0.02, 0.94, pow(limb, 1.45));
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
  textures: PlanetSurfaceTextures | undefined;
  moons: MoonSpec[];
  moonTextures: Record<string, PlanetSurfaceTextures>;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const cloudLayer = useRef<THREE.Mesh>(null);
  const position = useMemo(
    () => getPlanetaryBodyPosition(spec.name, new THREE.Vector3()).toArray() as [number, number, number],
    [spec.name],
  );
  const orbitPosition = useMemo(() => new THREE.Vector3(), []);
  const atmosphere = useMemo(
    () => spec.atmosphere ? makeAtmosphere(spec.atmosphere) : null,
    [spec.atmosphere],
  );

  useEffect(() => () => atmosphere?.dispose(), [atmosphere]);

  useFrame((_, delta) => {
    const visibility = universeState.reducedMotion
      ? 1
      : getPlanetaryBodyVisibility(universeState.progress, spec.name);
    if (group.current) {
      group.current.position.copy(getPlanetaryBodyPosition(spec.name, orbitPosition));
      group.current.visible = visibility > 0.001;
      group.current.scale.setScalar(0.72 + visibility * 0.28);
      if (visibility > 0.001) {
        group.current.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if (material instanceof THREE.ShaderMaterial) {
              material.uniforms.uIntensity.value = 0.105 * visibility;
              return;
            }
            const opacity = typeof material.userData.tourOpacity === "number"
              ? material.userData.tourOpacity
              : material.opacity;
            material.userData.tourOpacity = opacity;
            material.transparent = true;
            material.depthWrite = false;
            material.opacity = opacity * visibility;
          });
        });
      }
    }
    if (universeState.reducedMotion || universeState.ambientMotionPaused) return;
    if (body.current) body.current.rotation.y += delta * spec.spin * 8;
    if (cloudLayer.current) cloudLayer.current.rotation.y += delta * spec.spin * 8 * 1.18;
  });

  return (
    <group ref={group} position={position} rotation={[spec.tilt, 0, 0]}>
      <mesh ref={body} scale={spec.shape ?? 1}>
        <sphereGeometry args={[spec.radius, 64, 48]} />
        <meshStandardMaterial
          key={textures ? "surface-ready" : "surface-placeholder"}
          map={textures?.color ?? null}
          bumpMap={textures?.height ?? null}
          bumpScale={spec.bumpScale}
          color={getSpaceColor(textures ? "starlight" : spec.palette[1])}
          roughness={0.96}
          metalness={0}
        />
      </mesh>
      {textures?.clouds && (
        <mesh ref={cloudLayer} scale={1.012}>
          <sphereGeometry args={[spec.radius, 48, 36]} />
          <meshStandardMaterial
            map={textures.cloudsAreAlphaMap ? undefined : textures.clouds}
            alphaMap={textures.cloudsAreAlphaMap ? textures.clouds : undefined}
            color={getSpaceColor("starlight")}
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
          <group rotation={[
            spec.rings === "saturn" ? 0.34 : spec.rings === "uranus" ? 1.16 : 0,
            0,
            0,
          ]}>
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
  textures: PlanetSurfaceTextures | undefined;
}) {
  const orbit = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (
      universeState.reducedMotion ||
      universeState.ambientMotionPaused ||
      !orbit.current
    ) return;
    orbit.current.rotation.y += delta * spec.angularSpeed * 4;
  });

  return (
    <group rotation={[spec.inclination, 0, spec.phase]}>
      <group ref={orbit}>
        <mesh position={[spec.orbitRadius, 0, 0]}>
          <sphereGeometry args={[spec.radius, 32, 24]} />
          <meshStandardMaterial
            key={textures ? "surface-ready" : "surface-placeholder"}
            map={textures?.color ?? null}
            bumpMap={textures?.height ?? null}
            bumpScale={0.018}
            color={getSpaceColor(textures ? "starlight" : spec.palette[1])}
            roughness={0.98}
            metalness={0}
          />
        </mesh>
      </group>
    </group>
  );
}

function SolarCore({ surface }: { surface: THREE.Texture | null }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const corona = useRef<THREE.SpriteMaterial>(null);
  const glow = useMemo(() => makeSolarGlowTexture(), []);

  useEffect(() => () => glow?.dispose(), [glow]);

  useFrame((state, delta) => {
    const visibility = universeState.reducedMotion
      ? 1
      : getPlanetaryBodyVisibility(universeState.progress, "Sun");
    if (group.current) group.current.visible = visibility > 0.001;
    if (body.current) {
      (body.current.material as THREE.MeshBasicMaterial).opacity = visibility;
    }
    if (!universeState.ambientMotionPaused && !universeState.reducedMotion) {
      if (body.current) body.current.rotation.y += delta * 0.04;
    }
    if (corona.current) {
      corona.current.opacity = visibility * (
        universeState.ambientMotionPaused || universeState.reducedMotion
          ? 0.76
          : 0.76 + Math.sin(state.clock.elapsedTime * 0.7) * 0.06
      );
    }
  });

  return (
    <group>
      <pointLight
        color={getSpaceColor("planet-cream")}
        intensity={3600}
        distance={210}
        decay={1.65}
      />
      <group ref={group}>
        {glow && (
          <sprite position={[0, 0, 0]} scale={[30, 30, 1]} renderOrder={-1}>
            <spriteMaterial
              ref={corona}
              map={glow}
              transparent
              opacity={0.82}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        )}
        <mesh ref={body}>
          <sphereGeometry args={[3.2, 64, 48]} />
          <meshBasicMaterial
            key={surface ? "surface-ready" : "surface-placeholder"}
            map={surface}
            color={getSpaceColor(surface ? "starlight" : "gold")}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function TrajectoryPath() {
  const inclination = THREE.MathUtils.degToRad(ORBIT_INCLINATION);

  return (
    <group rotation={[Math.PI / 2 - inclination, 0, 0]}>
      {PLANETARY_TOUR_BODIES.map((body) => (
        <mesh key={body.name}>
          <torusGeometry args={[body.orbitRadius, 0.012, 4, 320]} />
          <meshBasicMaterial
            color={getSpaceColor("gold-muted")}
            transparent
            opacity={0.1}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function PlanetarySystem() {
  const [textures, setTextures] = useState<Record<string, PlanetSurfaceTextures>>({});
  const [moonTextures, setMoonTextures] = useState<Record<string, PlanetSurfaceTextures>>({});
  const [solarSurface, setSolarSurface] = useState<THREE.Texture | null>(null);
  const saturnMoons = useRef<THREE.Group>(null);
  const saturnOrbitPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (saturnMoons.current) {
      saturnMoons.current.position.copy(
        getPlanetaryBodyPosition("Saturn", saturnOrbitPosition),
      );
      saturnMoons.current.visible =
        getPlanetaryBodyVisibility(universeState.progress, "Saturn") > 0.001;
    }
  });

  useEffect(() => {
    let disposed = false;
    let surface: THREE.Texture | null = null;
    const planetSurfaces: PlanetSurfaceTextures[] = [];
    const satelliteSurfaces: PlanetSurfaceTextures[] = [];
    const planetTasks = PLANETS.map(async (spec, index) => {
      let planetTextures: PlanetSurfaceTextures;
      try {
        if (spec.name === "Earth") {
          planetTextures = await makeTerrestrialSurfaceTextures();
        } else if (PLANET_IMAGE_TEXTURES[spec.name]) {
          planetTextures = await loadPlanetImageSurface(spec.name);
        } else {
          planetTextures = await makePlanetSurfaceTextures(
            spec.surface,
            1101 + index * 1301,
            spec.palette,
          );
        }
      } catch {
        planetTextures = await makePlanetSurfaceTextures(
          spec.surface,
          1101 + index * 1301,
          spec.palette,
        );
      }
      return { name: spec.name, textures: planetTextures };
    }).map((task) => task.then(({ name, textures: planetSurface }) => {
      if (disposed) {
        disposeGeneratedSurfaceTextures([planetSurface]);
        return;
      }
      planetSurfaces.push(planetSurface);
      setTextures((current) => ({ ...current, [name]: planetSurface }));
    }));
    const moonTasks = MOONS.map(async (moon, index) => {
      let moonSurface: PlanetSurfaceTextures;
      if (index === 0) {
        try {
          const color = await loadPlanetImageTexture("/textures/planetary/2k_moon.webp");
          moonSurface = { color, height: null, clouds: null };
        } catch {
          moonSurface = await makePlanetSurfaceTextures(
            "rocky",
            41003,
            moon.palette,
            PROCEDURAL_MOON_TEXTURE_SIZE,
          );
        }
      } else {
        moonSurface = await makePlanetSurfaceTextures(
          "rocky",
          41003 + index * 1543,
          moon.palette,
          PROCEDURAL_MOON_TEXTURE_SIZE,
        );
      }
      return { name: moon.name, textures: moonSurface };
    }).map((task) => task.then(({ name, textures: moonSurface }) => {
      if (disposed) {
        disposeGeneratedSurfaceTextures([moonSurface]);
        return;
      }
      satelliteSurfaces.push(moonSurface);
      setMoonTextures((current) => ({ ...current, [name]: moonSurface }));
    }));
    const solarTask = loadSolarImageTexture()
      .catch(() => makeSolarSurfaceTexture(912735))
      .then((solarTexture) => {
        if (disposed) {
          disposeGeneratedTexture(solarTexture);
          return;
        }
        surface = solarTexture;
        setSolarSurface(solarTexture);
      });

    void loadPlanetImageTexture(PLANET_IMAGE_TEXTURES.Saturn!).catch(() => {});
    void Promise.allSettled([...planetTasks, ...moonTasks, solarTask]);

    return () => {
      disposed = true;
      disposeGeneratedTexture(surface);
      disposeGeneratedSurfaceTextures(planetSurfaces);
      disposeGeneratedSurfaceTextures(satelliteSurfaces);
    };
  }, []);

  return (
    <group>
      <TrajectoryPath />
      <SolarCore surface={solarSurface} />
      {PLANETS.map((spec) => (
        <CelestialPlanet
          key={spec.name}
          spec={spec}
          textures={textures[spec.name]}
          moons={MOONS.filter((moon) => moon.host === spec.name)}
          moonTextures={moonTextures}
        />
      ))}
      <group ref={saturnMoons} position={SATURN_POSITION}>
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

export function PlanetaryOrbitFrame({ children }: { children: ReactNode }) {
  useFrame((_, delta) => {
    if (!universeState.reducedMotion && !universeState.ambientMotionPaused) {
      advancePlanetaryOrbit(delta);
    }
  });

  return <group>{children}</group>;
}
