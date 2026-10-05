"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_SCROLL_STOPS } from "@/lib/cameraPath";
import { createSeededRandom } from "@/lib/random";
import { getSpaceColor } from "@/lib/spaceColors";
import { universeState } from "@/lib/universeState";
import { OPENING_SYSTEM_Z } from "@/lib/planetaryTour";

const INNER_RADIUS = 138;
const OUTER_RADIUS = 310;
const DESKTOP_COUNT = 420;
const MOBILE_COUNT = 180;

function makeOortCloudGeometry(count: number) {
  const random = createSeededRandom(39062026);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(getSpaceColor("planet-ice")),
    new THREE.Color(getSpaceColor("planet-lunar")),
    new THREE.Color(getSpaceColor("gold-muted")),
  ];

  for (let index = 0; index < count; index += 1) {
    const azimuth = random() * Math.PI * 2;
    const cosine = random() * 2 - 1;
    const sine = Math.sqrt(1 - cosine * cosine);
    const radius = Math.cbrt(
      INNER_RADIUS ** 3 + random() * (OUTER_RADIUS ** 3 - INNER_RADIUS ** 3),
    );
    const point = index * 3;
    positions[point] = radius * sine * Math.cos(azimuth);
    positions[point + 1] = radius * cosine;
    positions[point + 2] = radius * sine * Math.sin(azimuth);

    const color = palette[random() < 0.76 ? 0 : random() < 0.82 ? 1 : 2];
    const brightness = 0.32 + random() * 0.34;
    colors[point] = color.r * brightness;
    colors[point + 1] = color.g * brightness;
    colors[point + 2] = color.b * brightness;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function getOortVisibility(progress: number) {
  const erisArrival = CAMERA_SCROLL_STOPS[5];
  const earthArrival = CAMERA_SCROLL_STOPS[6];
  const stage = progress / Math.max(erisArrival, 0.0001) * 13;
  const reveal = THREE.MathUtils.smoothstep(stage, 8.4, 10.6);
  const fadeStart = erisArrival + (earthArrival - erisArrival) * 0.08;
  const fadeEnd = erisArrival + (earthArrival - erisArrival) * 0.52;
  const departure = 1 - THREE.MathUtils.smoothstep(progress, fadeStart, fadeEnd);
  return reveal * departure;
}

export function OortCloud() {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const width = useThree((state) => state.size.width);
  const count = width < 640 ? MOBILE_COUNT : DESKTOP_COUNT;
  const geometry = useMemo(() => makeOortCloudGeometry(count), [count]);
  const previousVisibility = useRef(-1);

  useEffect(() => {
    previousVisibility.current = -1;
  }, [count]);

  useFrame(() => {
    const visibility = getOortVisibility(universeState.progress);
    if (group.current) group.current.visible = visibility > 0.001;
    if (
      material.current &&
      Math.abs(visibility - previousVisibility.current) > 0.002
    ) {
      material.current.opacity = visibility * 0.13;
      previousVisibility.current = visibility;
    }
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group ref={group} position={[0, 0, OPENING_SYSTEM_Z]}>
      <points geometry={geometry} frustumCulled>
        <pointsMaterial
          ref={material}
          size={0.72}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
