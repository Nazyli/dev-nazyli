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
  { name: "Mercury", radius: 1.1, orbitRadius: 8, x: 0, y: 0, viewDistance: 8.5 },
  { name: "Venus", radius: 1.55, orbitRadius: 12, x: 1.8, y: 0.12, viewDistance: 9 },
  { name: "Earth", radius: 1.82, orbitRadius: 16, x: -1.5, y: 0.28, viewDistance: 10 },
  { name: "Mars", radius: 1.25, orbitRadius: 22, x: 2.5, y: -0.2, viewDistance: 9 },
  { name: "Ceres", radius: 1.2, orbitRadius: 24, x: -2.5, y: 0.35, viewDistance: 9 },
  { name: "Jupiter", radius: 3.1, orbitRadius: 32, x: 1.5, y: 0.15, viewDistance: 13 },
  { name: "Saturn", radius: 2.72, orbitRadius: 41, x: -3.5, y: 0.4, viewDistance: 13 },
  { name: "Uranus", radius: 2.05, orbitRadius: 48, x: 0.5, y: 1.3, viewDistance: 11 },
  { name: "Neptune", radius: 2.35, orbitRadius: 52, x: -3.2, y: 2.6, viewDistance: 12 },
  { name: "Pluto", radius: 1.25, orbitRadius: 57, x: -2.0, y: -1.0, viewDistance: 8 },
  { name: "Haumea", radius: 1.25, orbitRadius: 61, x: -2, y: 0.36, viewDistance: 7.8 },
  { name: "Makemake", radius: 1.3, orbitRadius: 64, x: -4.5, y: 0.18, viewDistance: 7.6 },
  { name: "Eris", radius: 1.45, orbitRadius: 70, x: -2, y: -0.12, viewDistance: 7.6 },
] as const;

export type PlanetaryTourBodyName = (typeof PLANETARY_TOUR_BODIES)[number]["name"];
export type PlanetaryFocusName = "Sun" | PlanetaryTourBodyName;
export type PlanetaryTourReadout = { body: PlanetaryFocusName; index: number };

const FOCUS_NAMES = [
  "Sun", "Mercury", "Venus", "Earth", "Mars", "Ceres",
  "Jupiter", "Saturn", "Uranus", "Neptune",
  "Pluto", "Haumea", "Makemake", "Eris",
] as const;
export const PLANETARY_FOCUS_COUNT = FOCUS_NAMES.length - 1;

const SUN_DISTANCE = 26;

const ORBIT_PHASE_START = -25;
const ORBIT_PHASE_STEP = -360 / 13;
export const ORBIT_INCLINATION = 20;
const ORBIT_AXIS = new THREE.Vector3(
  0,
  Math.cos(THREE.MathUtils.degToRad(ORBIT_INCLINATION)),
  -Math.sin(THREE.MathUtils.degToRad(ORBIT_INCLINATION)),
);
const BASE_ORBITAL_PERIOD_SECONDS = 80;
const planetaryOrbitAngles = new Map<PlanetaryTourBodyName, number>(
  PLANETARY_TOUR_BODIES.map(({ name }) => [name, 0]),
);
const planetaryOrbitPeriods = new Map<PlanetaryTourBodyName, number>(
  PLANETARY_TOUR_BODIES.map(({ name, orbitRadius }) => [
    name,
    BASE_ORBITAL_PERIOD_SECONDS * Math.pow(orbitRadius / 8, 1.5),
  ]),
);

export function advancePlanetaryOrbit(delta: number) {
  const frameDelta = Math.min(Math.max(delta, 0), 0.05);
  PLANETARY_TOUR_BODIES.forEach(({ name }) => {
    const angle = planetaryOrbitAngles.get(name) ?? 0;
    const period = planetaryOrbitPeriods.get(name) ?? BASE_ORBITAL_PERIOD_SECONDS;
    planetaryOrbitAngles.set(
      name,
      THREE.MathUtils.euclideanModulo(angle + (frameDelta * Math.PI * 2) / period, Math.PI * 2),
    );
  });
}

export function getPlanetaryOrbitAngle(name: PlanetaryTourBodyName) {
  return planetaryOrbitAngles.get(name) ?? 0;
}

const SUN_LOCAL = new THREE.Vector3(0, 0, 0);

const BODY_LOCALS = new Map<PlanetaryTourBodyName, THREE.Vector3>();
PLANETARY_TOUR_BODIES.forEach(({ orbitRadius, x, y, name }, index) => {
  const phase = THREE.MathUtils.degToRad(
    -(ORBIT_PHASE_START - index * ORBIT_PHASE_STEP),
  ) + Math.asin(THREE.MathUtils.clamp(x / orbitRadius, -1, 1)) * 0.35;
  const depth = Math.cos(phase) * orbitRadius;
  const inclination = THREE.MathUtils.degToRad(ORBIT_INCLINATION);
  const rise = index >= 9 ? (index - 8) * 1.5 : 0;
  BODY_LOCALS.set(
    name,
    new THREE.Vector3(
      Math.sin(phase) * orbitRadius,
      y + depth * Math.sin(inclination) + rise,
      depth * Math.cos(inclination),
    ),
  );
});

const FOCUS_LOCALS = FOCUS_NAMES.slice(1).map(
  (name) => BODY_LOCALS.get(name as PlanetaryTourBodyName)!.clone(),
);

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

const SEG_GAPS = FOCUS_POINTS.slice(0, -1).map((point, index) =>
  point.distanceTo(FOCUS_POINTS[index + 1]),
);

const CRUISE_DISTANCES = FOCUS_NAMES.map((name) => {
  if (name === "Sun") return SUN_DISTANCE;
  return PLANETARY_TOUR_BODIES[BODY_INDEX.get(name)!].viewDistance;
});

function getWindowAspect() {
  if (typeof window === "undefined") return 16 / 9;
  return window.innerWidth / Math.max(1, window.innerHeight);
}

function getSunDistance(aspect: number) {
  const clamped = Math.min(1, Math.max(0.4, aspect));
  const margin = 1.15 + 0.25 * THREE.MathUtils.clamp((1 - clamped) / 0.3, 0, 1);
  return (SUN_DISTANCE * margin) / clamped;
}

const targetCurve = new THREE.CatmullRomCurve3(
  FOCUS_POINTS.map((point) => point.clone()),
  false,
  "centripetal",
);
const dynamicOrbitPosition = new THREE.Vector3();

function updateTargetCurveForOrbits() {
  FOCUS_NAMES.forEach((name, index) => {
    const point = targetCurve.points[index];
    if (name === "Sun") {
      point.copy(FOCUS_POINTS[index]);
      return;
    }
    point.copy(getPlanetaryBodyPosition(name, dynamicOrbitPosition)).add(SYSTEM_OFFSET);
  });
}

const TILT_DIRECTION = new THREE.Vector3(-0.1, 0.12, -1).normalize();
const STRAIGHT_DIRECTION = new THREE.Vector3(0, 0, -1);
const SWAY_DIRECTION = new THREE.Vector3(0.482, 0.876, 0).normalize();
const SWAY_AMPLITUDE = 0.5;
const SWAY_CYCLES = 2;
const BANK_GAIN = 0.004;

export function getTourRoll(progress: number) {
  const tourEnd = CAMERA_SCROLL_STOPS[5];
  if (!(progress > 0) || progress >= tourEnd || tourEnd <= 0) return 0;
  const stage = THREE.MathUtils.clamp(progress / tourEnd, 0, 1);
  const swayVelocity = SWAY_AMPLITUDE * Math.PI * 2 * SWAY_CYCLES *
    Math.cos(stage * Math.PI * 2 * SWAY_CYCLES);
  return -BANK_GAIN * swayVelocity;
}

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
  const scaled = clamped * (FOCUS_NAMES.length - 1);
  const index = Math.min(FOCUS_NAMES.length - 2, Math.floor(scaled));
  const frac = scaled - index;
  const phase = smooth(frac);

  updateTargetCurveForOrbits();
  targetCurve.getPoint(clamped, target);

  const distances = [getSunDistance(aspect), ...CRUISE_DISTANCES.slice(1)];
  const distance = THREE.MathUtils.lerp(
    distances[index],
    distances[index + 1],
    phase,
  );

  const tilt = smooth(scaled / 1.2);
  const direction = STRAIGHT_DIRECTION.clone().lerp(TILT_DIRECTION, tilt).normalize();
  const weaveSide = index % 2 === 0 ? -1 : 1;
  const weaveAmp = 0.12 * THREE.MathUtils.clamp(SEG_GAPS[index] / 8, 0.3, 1);
  direction.x += weaveSide * weaveAmp * Math.sin(frac * Math.PI) * tilt;
  direction.normalize();
  position.copy(target).addScaledVector(direction, distance);
  position.addScaledVector(
    SWAY_DIRECTION,
    Math.sin(clamped * Math.PI * 2 * SWAY_CYCLES) * SWAY_AMPLITUDE,
  );
}

function getTourStage(progress: number) {
  const scaled = THREE.MathUtils.clamp(progress / getTourEnd(), 0, 1) * (FOCUS_NAMES.length - 1);
  const index = Math.min(FOCUS_NAMES.length - 2, Math.floor(scaled));
  return { index, phase: Math.min(1, scaled - index) };
}

const tailStartPosition = new THREE.Vector3();
const tailStartTarget = new THREE.Vector3();
sampleTour(1, 1, tailStartPosition, tailStartTarget);

const tailEndPosition = cameraPath.getPointAt(
  CAMERA_POSITION_STOPS[6],
  new THREE.Vector3(),
);
const tailEndTarget = cameraTargetPath.getPointAt(
  CAMERA_TARGET_STOPS[6],
  new THREE.Vector3(),
);

function bowedCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  bow: THREE.Vector3,
) {
  const control = start.clone().lerp(end, 0.5).add(bow);
  return new THREE.QuadraticBezierCurve3(start.clone(), control, end.clone());
}

const tailPositionCurve = bowedCurve(
  tailStartPosition,
  tailEndPosition,
  new THREE.Vector3(10, 6, 0),
);
const tailTargetCurve = bowedCurve(
  tailStartTarget,
  tailEndTarget,
  new THREE.Vector3(5, 3, 0),
);

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
    const focusIndex = THREE.MathUtils.clamp(
      Math.round(index + phase),
      0,
      FOCUS_NAMES.length - 1,
    );
    next = { body: FOCUS_NAMES[focusIndex], index: focusIndex - 1 };
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
  return target
    .copy(BODY_LOCALS.get(name) ?? SUN_LOCAL)
    .applyAxisAngle(ORBIT_AXIS, getPlanetaryOrbitAngle(name));
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
    tailPositionCurve.getPoint(blend, position);
    tailTargetCurve.getPoint(blend, target);
    getPlanetaryBodyPosition("Eris", dynamicOrbitPosition)
      .add(SYSTEM_OFFSET)
      .sub(FOCUS_POINTS[FOCUS_POINTS.length - 1]);
    target.addScaledVector(dynamicOrbitPosition, 1 - blend);
    position.addScaledVector(dynamicOrbitPosition, 1 - blend);
    return true;
  }

  sampleTour(THREE.MathUtils.clamp(progress / getTourEnd(), 0, 1), aspect, position, target);
  return true;
}
