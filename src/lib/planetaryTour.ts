import * as THREE from "three";
import {
  CAMERA_POSITION_STOPS,
  CAMERA_TARGET_STOPS,
  CAMERA_SCROLL_STOPS,
  cameraPath,
  cameraTargetPath,
} from "@/lib/cameraPath";

export const PLANETARY_TOUR_BODIES = [
  { name: "Mercury", radius: 1.1, orbitRadius: 10, x: 0, y: 0, viewDistance: 7.2 },
  { name: "Venus", radius: 1.55, orbitRadius: 18, x: 1.8, y: 0.12, viewDistance: 9.4 },
  { name: "Earth", radius: 1.82, orbitRadius: 27, x: -1.5, y: 0.28, viewDistance: 10.8 },
  { name: "Mars", radius: 1.25, orbitRadius: 36, x: 2.5, y: -0.2, viewDistance: 8.4 },
  { name: "Ceres", radius: 0.88, orbitRadius: 44, x: -2.5, y: 0.35, viewDistance: 7.4 },
  { name: "Jupiter", radius: 3.1, orbitRadius: 56, x: 3.5, y: 0.15, viewDistance: 17 },
  { name: "Saturn", radius: 2.72, orbitRadius: 70, x: -3.5, y: 0.4, viewDistance: 15.2 },
  { name: "Uranus", radius: 2.05, orbitRadius: 84, x: 2.5, y: -0.28, viewDistance: 12.2 },
  { name: "Neptune", radius: 2.35, orbitRadius: 99, x: -3.2, y: 0.22, viewDistance: 13.6 },
  { name: "Pluto", radius: 0.9, orbitRadius: 108, x: 3.4, y: -0.25, viewDistance: 7.4 },
  { name: "Haumea", radius: 0.72, orbitRadius: 116, x: -2, y: 0.36, viewDistance: 7.2 },
  { name: "Makemake", radius: 0.78, orbitRadius: 120, x: -4.5, y: 0.18, viewDistance: 7.2 },
  { name: "Eris", radius: 0.82, orbitRadius: 123, x: -5, y: -0.12, viewDistance: 7.4 },
] as const;

export type PlanetaryTourBodyName = (typeof PLANETARY_TOUR_BODIES)[number]["name"];

export type PlanetaryTourReadout = {
  body: PlanetaryTourBodyName;
  index: number;
};

let currentReadout: PlanetaryTourReadout | null = null;
const readoutListeners = new Set<() => void>();

export function subscribeToPlanetaryTourReadout(listener: () => void) {
  readoutListeners.add(listener);
  return () => readoutListeners.delete(listener);
}

export function getPlanetaryTourReadout() {
  return currentReadout;
}

export function updatePlanetaryTourReadout(progress: number) {
  const start = CAMERA_SCROLL_STOPS[2];
  const end = CAMERA_SCROLL_STOPS[6];
  const labelStart = start + ((end - start) * 0.5) / (PLANETARY_TOUR_BODIES.length + 1);
  const labelEnd = start +
    ((end - start) * (PLANETARY_TOUR_BODIES.length + 0.2)) /
      (PLANETARY_TOUR_BODIES.length + 1);
  let nextReadout: PlanetaryTourReadout | null = null;

  if (progress >= labelStart && progress < labelEnd) {
    const waypoint = getPlanetaryTourProgress(progress) * (PLANETARY_TOUR_BODIES.length + 1);
    const index = THREE.MathUtils.clamp(
      Math.round(waypoint) - 1,
      0,
      PLANETARY_TOUR_BODIES.length - 1,
    );
    nextReadout = { body: PLANETARY_TOUR_BODIES[index].name, index };
  }

  if (nextReadout?.index === currentReadout?.index) return;
  currentReadout = nextReadout;
  readoutListeners.forEach((listener) => listener());
}

const BODY_POSITIONS = PLANETARY_TOUR_BODIES.map(
  ({ orbitRadius, x, y }, index) => {
    const orbitalPhase = THREE.MathUtils.degToRad(58 - index * 2.6);
    const localPhase = Math.asin(
      THREE.MathUtils.clamp(x / orbitRadius, -1, 1),
    );
    const phase = -orbitalPhase + localPhase * 0.35;

    const orbitalInclination = THREE.MathUtils.degToRad(8);
    const depth = Math.cos(phase) * orbitRadius;

    return new THREE.Vector3(
      Math.sin(phase) * orbitRadius,
      y + depth * Math.sin(orbitalInclination),
      depth * Math.cos(orbitalInclination),
    );
  },
);

const CAMERA_POINTS = [
  cameraPath.getPointAt(CAMERA_POSITION_STOPS[2]),
  ...PLANETARY_TOUR_BODIES.map((body, index) =>
    BODY_POSITIONS[index].clone().add(
      new THREE.Vector3(
        body.viewDistance * 0.2 * (index % 2 === 0 ? 1 : -1),
        body.viewDistance * 0.44,
        -body.viewDistance,
      ),
    ),
  ),
  cameraPath.getPointAt(CAMERA_POSITION_STOPS[6]),
];

const TARGET_POINTS = [
  cameraTargetPath.getPointAt(CAMERA_TARGET_STOPS[2]),
  ...BODY_POSITIONS.map((position, index) =>
    position.clone().add(
      new THREE.Vector3(
        PLANETARY_TOUR_BODIES[index].viewDistance *
          0.2 *
          (index % 2 === 0 ? 1 : -1),
        0,
        0,
      ),
    ),
  ),
  new THREE.Vector3(4, 3.5, 138),
];

const cameraTour = new THREE.CatmullRomCurve3(CAMERA_POINTS, false, "centripetal");
const targetTour = new THREE.CatmullRomCurve3(TARGET_POINTS, false, "centripetal");
const BODY_INDEX = new Map(
  PLANETARY_TOUR_BODIES.map((body, index) => [body.name, index]),
);

export function getPlanetaryBodyPosition(
  name: PlanetaryTourBodyName,
  target: THREE.Vector3,
) {
  const index = BODY_INDEX.get(name) ?? 0;
  return target.copy(BODY_POSITIONS[index]);
}

export function getPlanetaryTourProgress(progress: number) {
  const start = CAMERA_SCROLL_STOPS[2];
  const end = CAMERA_SCROLL_STOPS[6];
  const span = Math.max(0.0001, end - start);
  return THREE.MathUtils.clamp((progress - start) / span, 0, 1);
}

export function getPlanetaryTourPose(
  progress: number,
  position: THREE.Vector3,
  target: THREE.Vector3,
) {
  const start = CAMERA_SCROLL_STOPS[2];
  const end = CAMERA_SCROLL_STOPS[6];
  if (progress < start || progress > end) return false;

  const localProgress = getPlanetaryTourProgress(progress);
  cameraTour.getPoint(localProgress, position);
  targetTour.getPoint(localProgress, target);
  return true;
}

