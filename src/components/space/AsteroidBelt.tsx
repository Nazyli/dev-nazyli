"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "@/lib/random";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";
import { CAMERA_SCROLL_STOPS } from "@/lib/cameraPath";

const ASTEROID_COUNT = 160;
const ASTEROID_TONES = ["dust", "dust", "dust", "dust", "gold-muted"] as const;

type AsteroidTone = (typeof ASTEROID_TONES)[number];

type AsteroidTransform = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  tone: AsteroidTone;
};

function makeAsteroidTransforms(): AsteroidTransform[] {
  const random = createSeededRandom(58123);
  return Array.from({ length: ASTEROID_COUNT }, () => {
    const angle = random() * Math.PI * 2;
    const radius = 24 + random() * 7;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * 0.58 + (random() - 0.5) * 1.8,
      z: (random() - 0.5) * 2.2,
      scale: 0.1 + random() * 0.14,
      rotationX: random() * Math.PI,
      rotationY: random() * Math.PI,
      rotationZ: random() * Math.PI,
      tone: ASTEROID_TONES[Math.floor(random() * ASTEROID_TONES.length)],
    };
  });
}

export function AsteroidBelt() {
  const group = useRef<THREE.Group>(null);
  const instances = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tint = useMemo(() => new THREE.Color(), []);
  const transforms = useMemo(() => makeAsteroidTransforms(), []);

  useEffect(() => {
    const mesh = instances.current;
    if (!mesh) return;

    transforms.forEach((transform, index) => {
      dummy.position.set(transform.x, transform.y, transform.z);
      dummy.rotation.set(
        transform.rotationX,
        transform.rotationY,
        transform.rotationZ,
      );
      dummy.scale.setScalar(transform.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      tint.set(getSpaceColor(transform.tone)).multiplyScalar(
        transform.tone === "gold-muted" ? 0.58 : 0.72,
      );
      mesh.setColorAt(index, tint);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dummy, tint, transforms]);

  useFrame((_, delta) => {
    const journeyProgress = universeState.progress / CAMERA_SCROLL_STOPS[5];
    const planetLeg = journeyProgress * 13;
    const approach = THREE.MathUtils.smoothstep(planetLeg, 3.35, 4.15);
    const departure = 1 - THREE.MathUtils.smoothstep(planetLeg, 5.05, 5.85);
    const visibility = approach * departure;
    if (group.current) group.current.visible = visibility > 0.001;
    if (material.current) material.current.opacity = visibility;
    if (
      group.current &&
      visibility > 0.001 &&
      !universeState.reducedMotion &&
      !universeState.ambientMotionPaused
    ) {
      group.current.rotation.z += delta * 0.0008;
    }
  });

  return (
    <group ref={group} position={[0, 0, 44]} rotation={[0.42, -0.08, 0]}>
      <instancedMesh ref={instances} args={[undefined, undefined, ASTEROID_COUNT]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          ref={material}
          color="white"
          transparent
          opacity={0}
          depthWrite={false}
          roughness={1}
          metalness={0}
        />
      </instancedMesh>
    </group>
  );
}
