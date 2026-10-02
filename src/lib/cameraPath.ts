import * as THREE from "three";
import { SECTION_REGISTRY } from "@/data/sections";

type CameraStation = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};

const CAMERA_STATIONS = {
  "s-hero": {
    position: new THREE.Vector3(0, 0, -46),
    target: new THREE.Vector3(0, 0, -10),
  },
  "s-about": {
    position: new THREE.Vector3(-3.5, 0.4, -26),
    target: new THREE.Vector3(-3.5, 0.2, 0),
  },
  "s-expertise": {
    position: new THREE.Vector3(-7, 1.2, -8),
    target: new THREE.Vector3(-7, 1, 4),
  },
  "s-projects": {
    position: new THREE.Vector3(5, 2.4, 6),
    target: new THREE.Vector3(3, 2, 12),
  },
  "s-certificates": {
    position: new THREE.Vector3(3.8, 3, 11),
    target: new THREE.Vector3(2, 2.8, 17),
  },
  "s-experience": {
    position: new THREE.Vector3(1.5, 3.4, 17),
    target: new THREE.Vector3(0, 3, 22),
  },
  "s-contact": {
    position: new THREE.Vector3(0, 2.2, 124),
    target: new THREE.Vector3(0, 2.2, 150),
  },
} satisfies Record<(typeof SECTION_REGISTRY)[number]["id"], CameraStation>;

export const CAMERA_POINTS = SECTION_REGISTRY.map(
  ({ id }) => CAMERA_STATIONS[id].position,
);

export const CAMERA_TARGET_POINTS = SECTION_REGISTRY.map(
  ({ id }) => CAMERA_STATIONS[id].target,
);

export const cameraPath = new THREE.CatmullRomCurve3(
  CAMERA_POINTS,
  false,
  "catmullrom",
  0.5
);

export const cameraTargetPath = new THREE.CatmullRomCurve3(
  CAMERA_TARGET_POINTS,
  false,
  "catmullrom",
  0.5
);

const STATION_SEGMENTS = Math.max(1, SECTION_REGISTRY.length - 1);
const CURVE_DIVISIONS = Math.ceil(600 / STATION_SEGMENTS) * STATION_SEGMENTS;
cameraPath.arcLengthDivisions = CURVE_DIVISIONS;
cameraTargetPath.arcLengthDivisions = CURVE_DIVISIONS;

function getStationProgress(curve: THREE.CatmullRomCurve3) {
  const lengths = curve.getLengths();
  const totalLength = lengths[lengths.length - 1] || 1;
  const progress = new Float32Array(SECTION_REGISTRY.length);
  const stationSegments = STATION_SEGMENTS;

  for (let i = 0; i < progress.length; i += 1) {
    const division = Math.round((i / stationSegments) * CURVE_DIVISIONS);
    progress[i] = lengths[division] / totalLength;
  }

  return progress;
}

export const CAMERA_POSITION_STOPS = getStationProgress(cameraPath);
export const CAMERA_TARGET_STOPS = getStationProgress(cameraTargetPath);

export const CAMERA_SCROLL_STOPS = new Float32Array(
  SECTION_REGISTRY.map((_, index) => index / (SECTION_REGISTRY.length - 1)),
);

export function setCameraScrollStops(stops: ArrayLike<number>) {
  let previous = 0;

  for (let i = 0; i < CAMERA_SCROLL_STOPS.length; i += 1) {
    const value = Number.isFinite(stops[i]) ? stops[i] : previous;
    const normalized = THREE.MathUtils.clamp(value, 0, 1);
    const stop = i === 0
      ? 0
      : i === CAMERA_SCROLL_STOPS.length - 1
        ? 1
        : Math.max(previous, normalized);

    CAMERA_SCROLL_STOPS[i] = stop;
    previous = stop;
  }
}

export function mapScrollProgressToCameraPath(
  progress: number,
  pathStops: Float32Array,
) {
  const normalized = THREE.MathUtils.clamp(progress, 0, 1);
  let upper = 1;

  while (
    upper < CAMERA_SCROLL_STOPS.length - 1 &&
    normalized > CAMERA_SCROLL_STOPS[upper]
  ) {
    upper += 1;
  }

  const lower = upper - 1;
  const scrollSpan = CAMERA_SCROLL_STOPS[upper] - CAMERA_SCROLL_STOPS[lower];
  const localProgress = scrollSpan > 0
    ? THREE.MathUtils.clamp(
        (normalized - CAMERA_SCROLL_STOPS[lower]) / scrollSpan,
        0,
        1,
      )
    : normalized >= CAMERA_SCROLL_STOPS[upper]
      ? 1
      : 0;

  return THREE.MathUtils.lerp(
    pathStops[lower],
    pathStops[upper],
    localProgress,
  );
}
