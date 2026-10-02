import * as THREE from "three";
import {
  CAMERA_SCROLL_STOPS,
  CAMERA_POSITION_STOPS,
  CAMERA_TARGET_STOPS,
  cameraPath,
  cameraTargetPath,
} from "@/lib/cameraPath";

export const OPENING_SYSTEM_Z = -18;

export const PLANETARY_TOUR_BODIES = [
  { name: "Mercury", radius: 1.1, orbitRadius: 10, x: 0, y: 0, viewDistance: 7.2 },
  { name: "Venus", radius: 1.55, orbitRadius: 18, x: 1.8, y: 0.12, viewDistance: 9.4 },
  { name: "Earth", radius: 1.82, orbitRadius: 27, x: -1.5, y: 0.28, viewDistance: 10.8 },
  { name: "Mars", radius: 1.25, orbitRadius: 36, x: 2.5, y: -0.2, viewDistance: 8.4 },
  { name: "Ceres", radius: 0.88, orbitRadius: 44, x: -2.5, y: 0.35, viewDistance: 7.4 },
  { name: "Jupiter", radius: 3.1, orbitRadius: 56, x: 3.5, y: 0.15, viewDistance: 17 },
  { name: "Saturn", radius: 2.72, orbitRadius: 70, x: -3.5, y: 0.4, viewDistance: 34 },
  { name: "Uranus", radius: 2.05, orbitRadius: 84, x: 2.5, y: -0.28, viewDistance: 12.2 },
  { name: "Neptune", radius: 2.35, orbitRadius: 99, x: -3.2, y: 0.22, viewDistance: 13.6 },
  { name: "Pluto", radius: 0.9, orbitRadius: 108, x: 3.4, y: -0.25, viewDistance: 7.4 },
  { name: "Haumea", radius: 0.72, orbitRadius: 116, x: -2, y: 0.36, viewDistance: 7.2 },
  { name: "Makemake", radius: 0.78, orbitRadius: 120, x: -4.5, y: 0.18, viewDistance: 7.2 },
  { name: "Eris", radius: 0.82, orbitRadius: 123, x: -5, y: -0.12, viewDistance: 7.4 },
] as const;

export type PlanetaryTourBodyName = (typeof PLANETARY_TOUR_BODIES)[number]["name"];
export type PlanetaryFocusName = "Sun" | PlanetaryTourBodyName;
export type PlanetaryTourReadout = { body: PlanetaryFocusName; index: number };

const FOCUS_NAMES = [
  "Sun", "Mercury", "Venus", "Earth", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune",
] as const;
export const PLANETARY_FOCUS_COUNT = FOCUS_NAMES.length;

const BODY_POSITIONS = PLANETARY_TOUR_BODIES.map(
  ({ orbitRadius, x, y }, index) => {
    const orbitalPhase = THREE.MathUtils.degToRad(58 - index * 2.6);
    const localPhase = Math.asin(THREE.MathUtils.clamp(x / orbitRadius, -1, 1));
    const phase = orbitalPhase + localPhase * 0.35;
    const depth = Math.cos(phase) * orbitRadius;
    const inclination = THREE.MathUtils.degToRad(8);
    return new THREE.Vector3(
      Math.sin(phase) * orbitRadius,
      y + depth * Math.sin(inclination),
      depth * Math.cos(inclination),
    );
  },
);

const BODY_INDEX = new Map(
  PLANETARY_TOUR_BODIES.map((body, index) => [body.name, index]),
);

const FOCUS_POINTS = FOCUS_NAMES.map((name) => {
  if (name === "Sun") return new THREE.Vector3(0, 0, OPENING_SYSTEM_Z);
  const index = BODY_INDEX.get(name)!;
  return BODY_POSITIONS[index].clone().add(new THREE.Vector3(0, 0, OPENING_SYSTEM_Z));
});

const APPROACH_POINTS = FOCUS_NAMES.map((name, index) => {
  const point = FOCUS_POINTS[index];
  const distance = name === "Sun"
    ? 22
    : PLANETARY_TOUR_BODIES[BODY_INDEX.get(name)!].viewDistance;
  return point.clone().add(new THREE.Vector3(
    name === "Sun" ? 0 : -distance * 0.12,
    name === "Sun" ? 0 : distance * 0.16,
    -distance,
  ));
});

const CLOSE_POINTS = FOCUS_NAMES.map((name, index) =>
  FOCUS_POINTS[index].clone().lerp(
    APPROACH_POINTS[index],
    name === "Sun" ? 0.5 : 0.57,
  ),
);

function smooth(progress: number) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
}

function getTourStage(progress: number) {
  const tourEnd = Math.max(CAMERA_SCROLL_STOPS[5], 0.0001);
  const scaled = THREE.MathUtils.clamp(progress / tourEnd, 0, 1) * FOCUS_NAMES.length;
  const index = Math.min(FOCUS_NAMES.length - 1, Math.floor(scaled));
  return { index, phase: Math.min(1, scaled - index) };
}

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
  const end = CAMERA_SCROLL_STOPS[5];
  let next: PlanetaryTourReadout | null = null;
  if (progress <= end && end > 0) {
    const { index, phase } = getTourStage(progress);
    const focusIndex = phase > 0.76 && index < FOCUS_NAMES.length - 1
      ? index + 1
      : index;
    next = { body: FOCUS_NAMES[focusIndex], index: focusIndex };
  }
  if (next?.index === currentReadout?.index) return;
  currentReadout = next;
  readoutListeners.forEach((listener) => listener());
}

export function getPlanetaryBodyPosition(
  name: PlanetaryTourBodyName,
  target: THREE.Vector3,
) {
  return target.copy(BODY_POSITIONS[BODY_INDEX.get(name) ?? 0]);
}

export function getPlanetaryBodyVisibility(
  progress: number,
  name: PlanetaryFocusName,
) {
  const focusIndex = FOCUS_NAMES.findIndex((focus) => focus === name);
  if (focusIndex < 0) return 0;
  if (progress > CAMERA_SCROLL_STOPS[5]) {
    return focusIndex === FOCUS_NAMES.length - 1
      ? 1 - smooth(
          (progress - CAMERA_SCROLL_STOPS[5]) /
            Math.max(0.0001, (CAMERA_SCROLL_STOPS[6] - CAMERA_SCROLL_STOPS[5]) * 0.72),
        )
      : 0;
  }

  const { index, phase } = getTourStage(progress);
  if (focusIndex === index) {
    return index === FOCUS_NAMES.length - 1
      ? 1
      : 1 - smooth((phase - 0.56) / 0.36);
  }
  if (focusIndex === index + 1) return smooth((phase - 0.54) / 0.38);
  return 0;
}

export function getPlanetaryTourPose(
  progress: number,
  position: THREE.Vector3,
  target: THREE.Vector3,
) {
  const tourEnd = CAMERA_SCROLL_STOPS[5];
  const contact = CAMERA_SCROLL_STOPS[6];
  if (progress < 0 || progress > contact) return false;

  if (progress > tourEnd) {
    const blend = smooth((progress - tourEnd) / Math.max(0.0001, contact - tourEnd));
    cameraPath.getPointAt(CAMERA_POSITION_STOPS[6], position);
    cameraTargetPath.getPointAt(CAMERA_TARGET_STOPS[6], target);
    position.lerpVectors(CLOSE_POINTS[CLOSE_POINTS.length - 1], position, blend);
    target.lerpVectors(FOCUS_POINTS[FOCUS_POINTS.length - 1], target, blend);
    return true;
  }

  const { index, phase } = getTourStage(progress);
  const focus = FOCUS_POINTS[index];
  const approach = APPROACH_POINTS[index];
  const close = CLOSE_POINTS[index];
  if (phase < 0.56 || index === FOCUS_NAMES.length - 1) {
    position.copy(approach).lerp(close, smooth((phase - 0.12) / 0.44));
    target.copy(focus);
  } else {
    const blend = smooth((phase - 0.56) / 0.36);
    position.copy(close).lerp(APPROACH_POINTS[index + 1], blend);
    target.copy(focus).lerp(FOCUS_POINTS[index + 1], blend);
  }
  return true;
}
