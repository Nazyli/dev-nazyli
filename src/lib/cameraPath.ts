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
    position: new THREE.Vector3(0, 0.4, -26),
    target: new THREE.Vector3(0, 0.2, 0),
  },
  "s-expertise": {
    position: new THREE.Vector3(3.5, 1.2, -8),
    target: new THREE.Vector3(2, 1, 4),
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
