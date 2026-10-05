"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "@/lib/random";
import { CAMERA_SCROLL_STOPS } from "@/lib/cameraPath";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";
import { universeState } from "@/lib/universeState";

const ORBIT_CLUSTERS = [0.18, 1.32, 2.76, 4.1, 5.48];

type BeltBody = {
  radius: number;
  angle: number;
  inclination: number;
  verticalOffset: number;
  angularSpeed: number;
  spinSpeed: number;
  scale: [number, number, number];
  rotation: THREE.Euler;
  tone: SpaceColorToken;
  brightness: number;
};

function makeBeltBodies(count: number): BeltBody[] {
  const random = createSeededRandom(5812026);

  return Array.from({ length: count }, () => {
    const radius = 73 + Math.pow(random(), 1.15) * 31;
    const clustered = random() < 0.58;
    const cluster = ORBIT_CLUSTERS[Math.floor(random() * ORBIT_CLUSTERS.length)];
    const angle = clustered
      ? cluster + (random() - 0.5) * (0.14 + random() * 0.58)
      : random() * Math.PI * 2;
    const foreground = random() < 0.045;
    const largeTno = random() < 0.018;
    const rareIce = random() < 0.075;
    const surfaceType = random();
    const tone: SpaceColorToken = rareIce || largeTno
      ? "planet-ice"
      : surfaceType < 0.54
        ? random() < 0.5 ? "planet-basalt" : "dust"
        : "planet-lunar";

    return {
      radius,
      angle,
      inclination: THREE.MathUtils.degToRad(20 + (random() - 0.5) * 12),
      verticalOffset: (random() - 0.5) * (foreground ? 10 : 6),
      angularSpeed: 0.000018 * Math.pow(80 / radius, 1.5) * (
        random() < 0.14 ? 0.22 : 0.9 + random() * 0.2
      ),
      spinSpeed: (random() - 0.5) * 0.0008,
      scale: (() => {
        const size = largeTno
          ? 0.42 + random() * 0.28
          : foreground
            ? 0.18 + random() * 0.14
            : 0.035 + Math.pow(random(), 2.6) * 0.12;
        return [
          size * (0.72 + random() * 0.58),
          size * (0.72 + random() * 0.58),
          size * (0.72 + random() * 0.58),
        ] as [number, number, number];
      })(),
      rotation: new THREE.Euler(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI,
      ),
      tone,
      brightness: rareIce || largeTno
        ? 0.78 + random() * 0.22
        : tone === "planet-lunar"
          ? 0.52 + random() * 0.28
          : 0.34 + random() * 0.28,
    };
  });
}

function makeRockGeometry() {
  const geometry = new THREE.IcosahedronGeometry(0.5, 1);
  const positions = geometry.getAttribute("position");
  const random = createSeededRandom(784123);
  const vertexRadii = new Map<string, number>();

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const key = `${x.toFixed(4)}:${y.toFixed(4)}:${z.toFixed(4)}`;
    let radius = vertexRadii.get(key);
    if (radius === undefined) {
      radius = 0.84 + random() * 0.32;
      vertexRadii.set(key, radius);
    }
    positions.setXYZ(index, x * radius, y * radius, z * radius);
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function getBeltVisibility(progress: number) {
  const erisArrival = CAMERA_SCROLL_STOPS[5];
  const earthArrival = CAMERA_SCROLL_STOPS[6];
  const reveal = THREE.MathUtils.smoothstep(
    progress,
    erisArrival * 0.66,
    erisArrival * 0.96,
  );
  const departure = 1 - THREE.MathUtils.smoothstep(
    progress,
    erisArrival + (earthArrival - erisArrival) * 0.22,
    erisArrival + (earthArrival - erisArrival) * 0.56,
  );

  return reveal * departure;
}

export function KuiperBelt() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const size = useThree((state) => state.size);
  const bodyCount = size.width < 640 ? 64 : size.width < 1024 ? 108 : 168;
  const bodies = useMemo(() => makeBeltBodies(bodyCount), [bodyCount]);
  const geometry = useMemo(() => makeRockGeometry(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tint = useMemo(() => new THREE.Color(), []);
  const previousVisibility = useRef(-1);

  useEffect(() => {
    previousVisibility.current = -1;
  }, [bodyCount]);

  useFrame((_, delta) => {
    const instanceMesh = mesh.current;
    if (!instanceMesh) return;

    const visibility = getBeltVisibility(universeState.progress);
    if (group.current) group.current.visible = visibility > 0.001;
    if (visibility <= 0.001) return;

    const moving = !universeState.reducedMotion && !universeState.ambientMotionPaused;
    const frameDelta = Math.min(delta, 1 / 30);
    const recolor = Math.abs(visibility - previousVisibility.current) > 0.002;
    const updateTransforms = moving || previousVisibility.current < 0;
    bodies.forEach((body, index) => {
      if (updateTransforms) {
        if (moving) body.angle += body.angularSpeed * frameDelta;
        if (moving) body.rotation.y += body.spinSpeed * frameDelta;
        const depth = Math.sin(body.angle) * body.radius;
        dummy.position.set(
          Math.cos(body.angle) * body.radius,
          depth * Math.sin(body.inclination) + body.verticalOffset,
          depth * Math.cos(body.inclination),
        );
        dummy.rotation.set(
          body.rotation.x,
          body.rotation.y,
          body.rotation.z,
        );
        dummy.scale.set(...body.scale);
        dummy.updateMatrix();
        instanceMesh.setMatrixAt(index, dummy.matrix);
      }
      if (recolor) {
        tint.set(getSpaceColor(body.tone)).multiplyScalar(body.brightness * visibility);
        instanceMesh.setColorAt(index, tint);
      }
    });
    if (updateTransforms) instanceMesh.instanceMatrix.needsUpdate = true;
    if (recolor && instanceMesh.instanceColor) {
      instanceMesh.instanceColor.needsUpdate = true;
      previousVisibility.current = visibility;
    }
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group ref={group} position={[0, 0, -18]}>
      <instancedMesh ref={mesh} args={[geometry, undefined, bodyCount]}>
        <meshStandardMaterial roughness={0.86} metalness={0} />
      </instancedMesh>
    </group>
  );
}
