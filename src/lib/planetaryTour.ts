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
  { name: "Mercury", radius: 1.1, viewDistance: 7.6 },
  { name: "Venus", radius: 1.55, viewDistance: 8.2 },
  { name: "Earth", radius: 1.82, viewDistance: 9.6 },
  { name: "Mars", radius: 1.25, viewDistance: 7.6 },
  { name: "Ceres", radius: 0.88, viewDistance: 7.4 },
  { name: "Jupiter", radius: 3.1, viewDistance: 15 },
  { name: "Saturn", radius: 2.72, viewDistance: 14.2 },
  { name: "Uranus", radius: 2.05, viewDistance: 10.8 },
  { name: "Neptune", radius: 2.35, viewDistance: 12.4 },
  { name: "Pluto", radius: 0.9, viewDistance: 7.4 },
  { name: "Haumea", radius: 0.72, viewDistance: 7.2 },
  { name: "Makemake", radius: 0.78, viewDistance: 7.2 },
  { name: "Eris", radius: 0.82, viewDistance: 7.4 },
] as const;

export type PlanetaryTourBodyName = (typeof PLANETARY_TOUR_BODIES)[number]["name"];
export type PlanetaryFocusName = "Sun" | PlanetaryTourBodyName;
export type PlanetaryTourReadout = { body: PlanetaryFocusName; index: number };

const FOCUS_NAMES = [
  "Sun", "Mercury", "Venus", "Earth", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune",
] as const;
export const PLANETARY_FOCUS_COUNT = FOCUS_NAMES.length;

const DIAGONAL_DIRECTION = new THREE.Vector2(-8.5, 6.5).normalize();
const LEG_LENGTHS = [6, 6, 6, 6, 8, 10, 9, 8];
const LEG_DEPTH = -1.2;
const DIAGONAL_SIDE = new THREE.Vector3(6.5, 8.5, 0).normalize();

const SUN_LOCAL = new THREE.Vector3(0, 0, 0);

const FOCUS_LOCALS: THREE.Vector3[] = [];
{
  const cursor = SUN_LOCAL.clone();
  for (const length of LEG_LENGTHS) {
    cursor.x += DIAGONAL_DIRECTION.x * length;
    cursor.y += DIAGONAL_DIRECTION.y * length;
    cursor.z += LEG_DEPTH;
    FOCUS_LOCALS.push(cursor.clone());
  }
}

const NEPTUNE_LOCAL = FOCUS_LOCALS[FOCUS_LOCALS.length - 1];

function between(
  a: THREE.Vector3,
  b: THREE.Vector3,
  t: number,
  side: number,
) {
  return a.clone().lerp(b, t).addScaledVector(DIAGONAL_SIDE, side);
}

const BODY_LOCALS = new Map<PlanetaryTourBodyName, THREE.Vector3>([
  ["Mercury", FOCUS_LOCALS[0].clone()],
  ["Venus", FOCUS_LOCALS[1].clone()],
  ["Earth", FOCUS_LOCALS[2].clone()],
  ["Mars", FOCUS_LOCALS[3].clone()],
  ["Ceres", between(FOCUS_LOCALS[3], FOCUS_LOCALS[4], 0.5, 2.8)],
  ["Jupiter", FOCUS_LOCALS[4].clone()],
  ["Saturn", FOCUS_LOCALS[5].clone()],
  ["Uranus", FOCUS_LOCALS[6].clone()],
  ["Neptune", NEPTUNE_LOCAL.clone()],
  ["Pluto", between(FOCUS_LOCALS[6], NEPTUNE_LOCAL, 0.55, 3)],
  ["Haumea", between(FOCUS_LOCALS[5], FOCUS_LOCALS[6], 0.5, -3)],
  ["Makemake", between(FOCUS_LOCALS[4], FOCUS_LOCALS[5], 0.5, -3.2)],
  ["Eris", between(FOCUS_LOCALS[0], FOCUS_LOCALS[1], 0.5, 3)],
]);

const BODY_INDEX = new Map(
  PLANETARY_TOUR_BODIES.map((body, index) => [body.name, index]),
);

const SYSTEM_OFFSET = new THREE.Vector3(0, 0, OPENING_SYSTEM_Z);

export const PLANETARY_DIAGONAL_POINTS: readonly THREE.Vector3[] = [
  SUN_LOCAL,
  ...FOCUS_LOCALS,
].map((point) => point.clone());

const FOCUS_POINTS = [SUN_LOCAL, ...FOCUS_LOCALS].map((point) =>
  point.clone().add(SYSTEM_OFFSET),
);

const COMPOSITION_CENTER = SUN_LOCAL.clone()
  .add(NEPTUNE_LOCAL)
  .multiplyScalar(0.5)
  .add(SYSTEM_OFFSET);

const COMPOSITION_RADIUS =
  NEPTUNE_LOCAL.clone().sub(SUN_LOCAL).length() / 2 + 5;

const CAMERA_FOV = 55;
const OVERVIEW_MARGIN = 1.08;

function getWindowAspect() {
  if (typeof window === "undefined") return 16 / 9;
  const height = Math.max(1, window.innerHeight);
  return window.innerWidth / height;
}

export function getOverviewDistance(aspect: number) {
  const verticalTan = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
  const effectiveTan = verticalTan * Math.min(1, Math.max(0.2, aspect));
  return (COMPOSITION_RADIUS / effectiveTan) * OVERVIEW_MARGIN;
}

const CRUISE_DISTANCES = [16, 12, 11.5, 11, 10.5, 10.5, 10.5, 10, 9.5];

const TARGET_KEYS = [
  COMPOSITION_CENTER.clone(),
  ...FOCUS_POINTS,
];

const targetCurve = new THREE.CatmullRomCurve3(
  TARGET_KEYS,
  false,
  "centripetal",
);

const TILT_DIRECTION = new THREE.Vector3(-0.16, 0.2, -1).normalize();
const STRAIGHT_DIRECTION = new THREE.Vector3(0, 0, -1);
const TRANSFER_BULGE = 2.2;

function smooth(progress: number) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  return t * t * (3 - 2 * t);
}

function getTourEnd() {
  return Math.max(CAMERA_SCROLL_STOPS[5], 0.0001);
}

function sampleTour(
  stage: number,
  aspect: number,
  position: THREE.Vector3,
  target: THREE.Vector3,
) {
  const clamped = THREE.MathUtils.clamp(stage, 0, 1);
  const scaled = clamped * FOCUS_NAMES.length;
  const index = Math.min(FOCUS_NAMES.length - 1, Math.floor(scaled));
  const phase = smooth(scaled - index);

  targetCurve.getPoint(clamped, target);

  const wide = getOverviewDistance(aspect);
  const distances = [wide, ...CRUISE_DISTANCES];
  const cruise = THREE.MathUtils.lerp(distances[index], distances[index + 1], phase);
  const distance = cruise + Math.sin(phase * Math.PI) * TRANSFER_BULGE;

  const tilt = smooth(scaled / 1.4);
  const direction = STRAIGHT_DIRECTION.clone().lerp(TILT_DIRECTION, tilt).normalize();
  position.copy(target).addScaledVector(direction, distance);
}

function getTourStage(progress: number) {
  const scaled = THREE.MathUtils.clamp(progress / getTourEnd(), 0, 1) * FOCUS_NAMES.length;
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
    const key = Math.round(index + phase);
    const focusIndex = THREE.MathUtils.clamp(key - 1, 0, FOCUS_NAMES.length - 1);
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
  if ((name as string) === "Sun") return target.copy(SUN_LOCAL);
  return target.copy(BODY_LOCALS.get(name) ?? SUN_LOCAL);
}

export function getPlanetaryBodyVisibility(
  progress: number,
  name: PlanetaryFocusName,
) {
  const known = name === "Sun" || BODY_INDEX.has(name as PlanetaryTourBodyName);
  if (!known) return 0;
  const tourEnd = CAMERA_SCROLL_STOPS[5];
  const contact = CAMERA_SCROLL_STOPS[6];
  if (progress > tourEnd) {
    const gap = Math.max(0.0001, (contact - tourEnd) * 0.55);
    return 1 - smooth((progress - tourEnd) / gap);
  }
  return 1;
}

export function getPlanetaryTourPose(
  progress: number,
  position: THREE.Vector3,
  target: THREE.Vector3,
  aspect: number = getWindowAspect(),
) {
  const tourEnd = CAMERA_SCROLL_STOPS[5];
  const contact = CAMERA_SCROLL_STOPS[6];
  if (progress < 0 || progress > contact) return false;

  if (progress > tourEnd) {
    const blend = smooth((progress - tourEnd) / Math.max(0.0001, contact - tourEnd));
    sampleTour(1, aspect, position, target);
    const contactPosition = new THREE.Vector3();
    const contactTarget = new THREE.Vector3();
    cameraPath.getPointAt(CAMERA_POSITION_STOPS[6], contactPosition);
    cameraTargetPath.getPointAt(CAMERA_TARGET_STOPS[6], contactTarget);
    position.lerp(contactPosition, blend);
    target.lerp(contactTarget, blend);
    return true;
  }

  sampleTour(THREE.MathUtils.clamp(progress / getTourEnd(), 0, 1), aspect, position, target);
  return true;
}
