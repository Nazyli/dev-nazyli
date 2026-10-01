"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cameraPath, cameraTargetPath, CAMERA_POSITION_STOPS, CAMERA_TARGET_STOPS } from "@/lib/cameraPath";
import { createSeededRandom } from "@/lib/random";
import { getSpaceColor } from "@/lib/spaceColors";
import { universeState } from "@/lib/universeState";

const STAR_COUNT = 1500;
const PROJECTS_STATION = 3;
const ARM_COUNT = 4;
const GALAXY_RADIUS = 8.5;

function makeGalaxyGeometry() {
  const random = createSeededRandom(718235);
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  const cool = new THREE.Color(getSpaceColor("planet-ice"));
  const warm = new THREE.Color(getSpaceColor("planet-cloud"));
  const core = new THREE.Color(getSpaceColor("gold-muted"));

  for (let index = 0; index < STAR_COUNT; index += 1) {
    const i3 = index * 3;
    const inBulge = random() < 0.28;
    const radius = inBulge
      ? Math.pow(random(), 1.8) * 2.4
      : 1.4 + Math.pow(random(), 0.78) * (GALAXY_RADIUS - 1.4);
    const arm = Math.floor(random() * ARM_COUNT);
    const angle = inBulge
      ? random() * Math.PI * 2
      : arm * Math.PI * 2 / ARM_COUNT + radius * 0.56 + (random() - 0.5) * 0.56;
    const width = inBulge ? 0.54 : 0.22 + radius * 0.025;
    const x = Math.cos(angle) * radius + (random() - 0.5) * width;
    const z = Math.sin(angle) * radius + (random() - 0.5) * width;
    const y = (random() - 0.5) * (inBulge ? 1.1 : 0.34 + radius * 0.045);
    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    const color = cool.clone().lerp(warm, random() * 0.32);
    color.lerp(core, Math.pow(1 - radius / GALAXY_RADIUS, 3) * 0.68);
    const brightness = (0.76 + random() * 0.3) * (1.18 - radius / GALAXY_RADIUS * 0.35);
    colors[i3] = color.r * brightness;
    colors[i3 + 1] = color.g * brightness;
    colors[i3 + 2] = color.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function makeStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2d context unavailable");
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.8)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function getRoutePosition(aspect: number) {
  const camera = cameraPath.getPointAt(CAMERA_POSITION_STOPS[PROJECTS_STATION]);
  const target = cameraTargetPath.getPointAt(CAMERA_TARGET_STOPS[PROJECTS_STATION]);
  const forward = target.sub(camera).normalize();
  const right = new THREE.Vector3()
    .crossVectors(new THREE.Vector3(0, 1, 0), forward)
    .normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();
  const distance = 46;
  const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(55 / 2));

  return camera
    .addScaledVector(forward, distance)
    .addScaledVector(right, halfHeight * aspect * 0.72)
    .addScaledVector(up, -halfHeight * 0.42)
    .toArray() as [number, number, number];
}

export function DeepSkyGalaxy() {
  const group = useRef<THREE.Group>(null);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const position = useMemo(() => getRoutePosition(aspect), [aspect]);
  const geometry = useMemo(() => makeGalaxyGeometry(), []);
  const map = useMemo(() => makeStarTexture(), []);
  const material = useMemo(
    () => new THREE.PointsMaterial({
      size: 0.22,
      map,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      alphaTest: 0.04,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false,
    }),
    [map],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
    map.dispose();
  }, [geometry, map, material]);

  useFrame((_, delta) => {
    if (universeState.reducedMotion || universeState.ambientMotionPaused || !group.current) return;
    group.current.rotation.y += delta * 0.0012;
  });

  return (
    <group
      ref={group}
      position={position}
      rotation={[0.34, -0.16, 0.24]}
      scale={0.9}
    >
      <points geometry={geometry} material={material} />
    </group>
  );
}
