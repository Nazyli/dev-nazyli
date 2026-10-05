"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_SCROLL_STOPS } from "@/lib/cameraPath";
import { createSeededRandom } from "@/lib/random";
import { getSpaceColor } from "@/lib/spaceColors";
import { universeState } from "@/lib/universeState";
import {
  OPENING_SYSTEM_Z,
  ORBIT_INCLINATION,
  getPlanetaryBodyPosition,
} from "@/lib/planetaryTour";

type Trojan = {
  phase: number;
  radialOffset: number;
  verticalOffset: number;
  rotation: THREE.Euler;
  scale: number;
  tone: "dust" | "planet-lunar" | "planet-ice";
  brightness: number;
};

function makeTrojans(count: number) {
  const random = createSeededRandom(284621);
  const swarmSize = Math.floor(count / 2);
  return Array.from({ length: count }, (_, index): Trojan => {
    const leading = index < swarmSize;
    const clusterSpread = (random() + random() + random() - 1.5) * 0.14;
    const icy = random() < 0.045;
    const tone: Trojan["tone"] = icy
      ? "planet-ice"
      : random() < 0.62 ? "dust" : "planet-lunar";

    return {
      phase: (leading ? 1 : -1) * Math.PI / 3 + clusterSpread,
      radialOffset: (random() - 0.5) * 2.1,
      verticalOffset: (random() - 0.5) * 1.9,
      rotation: new THREE.Euler(
        random() * Math.PI,
        random() * Math.PI,
        random() * Math.PI,
      ),
      scale: 0.035 + Math.pow(random(), 2.7) * 0.15,
      tone,
      brightness: icy ? 0.58 + random() * 0.2 : 0.28 + random() * 0.24,
    };
  });
}

const ORBIT_NORMAL = new THREE.Vector3(
  0,
  Math.cos(THREE.MathUtils.degToRad(ORBIT_INCLINATION)),
  -Math.sin(THREE.MathUtils.degToRad(ORBIT_INCLINATION)),
);

export function JupiterTrojans() {
  const group = useRef<THREE.Group>(null);
  const instances = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const size = useThree((state) => state.size);
  const count = size.width < 640 ? 24 : size.width < 1024 ? 36 : 48;
  const trojans = useMemo(() => makeTrojans(count), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const jupiterPosition = useMemo(() => new THREE.Vector3(), []);
  const tint = useMemo(() => new THREE.Color(), []);
  const previousStage = useRef(-1);
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(0.5, 0), []);

  useEffect(() => {
    previousStage.current = -1;
  }, [count]);

  useFrame(() => {
    const instanceMesh = instances.current;
    if (!instanceMesh) return;

    const progress = Math.min(
      1,
      universeState.progress / CAMERA_SCROLL_STOPS[5],
    );
    const planetStage = progress * 13;
    const approach = THREE.MathUtils.smoothstep(planetStage, 4.7, 5.65);
    const departure = 1 - THREE.MathUtils.smoothstep(planetStage, 6.35, 7.05);
    const visibility = approach * departure;
    if (group.current) group.current.visible = visibility > 0.001;
    if (material.current) material.current.opacity = visibility;
    if (visibility <= 0.001) return;

    const moving = !universeState.reducedMotion && !universeState.ambientMotionPaused;
    if (!moving && previousStage.current >= 0) return;
    getPlanetaryBodyPosition("Jupiter", jupiterPosition);
    const orbitRadius = jupiterPosition.length();
    trojans.forEach((trojan, index) => {
      dummy.position
        .copy(jupiterPosition)
        .multiplyScalar((orbitRadius + trojan.radialOffset) / orbitRadius)
        .applyAxisAngle(ORBIT_NORMAL, trojan.phase)
        .addScaledVector(ORBIT_NORMAL, trojan.verticalOffset);
      dummy.rotation.copy(trojan.rotation);
      dummy.scale.setScalar(trojan.scale);
      dummy.updateMatrix();
      instanceMesh.setMatrixAt(index, dummy.matrix);
      tint.set(getSpaceColor(trojan.tone)).multiplyScalar(trojan.brightness);
      instanceMesh.setColorAt(index, tint);
    });
    instanceMesh.instanceMatrix.needsUpdate = true;
    if (instanceMesh.instanceColor) instanceMesh.instanceColor.needsUpdate = true;
    previousStage.current = planetStage;
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group position={[0, 0, OPENING_SYSTEM_Z]}>
      <instancedMesh ref={instances} args={[geometry, undefined, count]}>
        <meshStandardMaterial
          ref={material}
          roughness={0.96}
          metalness={0}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
