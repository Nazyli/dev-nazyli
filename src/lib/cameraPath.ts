import * as THREE from "three";

export const CAMERA_POINTS = [
  new THREE.Vector3(0, 0, -46),
  new THREE.Vector3(0, 0.4, -26),
  new THREE.Vector3(3.5, 1.2, -8),
  new THREE.Vector3(5, 2.4, 6),
  new THREE.Vector3(3.8, 3, 11),
  new THREE.Vector3(1.5, 3.4, 17),
  new THREE.Vector3(0, 2.2, 24),
];

export const CAMERA_TARGET_POINTS = [
  new THREE.Vector3(0, 0, -10),
  new THREE.Vector3(0, 0.2, 0),
  new THREE.Vector3(2, 1, 4),
  new THREE.Vector3(3, 2, 12),
  new THREE.Vector3(2, 2.8, 17),
  new THREE.Vector3(0, 3, 22),
  new THREE.Vector3(0, 2, 30),
];

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
