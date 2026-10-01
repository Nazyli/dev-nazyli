"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createSeededRandom } from "@/lib/random";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";

const ASTEROID_COUNT = 180;

type AsteroidTransform = {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
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
      scale: 0.15 + random() * 0.2,
      rotationX: random() * Math.PI,
      rotationY: random() * Math.PI,
      rotationZ: random() * Math.PI,
    };
  });
}

export function AsteroidBelt() {
  const group = useRef<THREE.Group>(null);
  const instances = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
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
    });

    mesh.instanceMatrix.needsUpdate = true;
  }, [dummy, transforms]);

  useFrame((_, delta) => {
    if (
      group.current &&
      !universeState.reducedMotion &&
      !universeState.ambientMotionPaused
    ) {
      group.current.rotation.z += delta * 0.0008;
    }
  });

  return (
    <group ref={group} position={[0, 0, 54]} rotation={[0.42, -0.08, 0]}>
      <instancedMesh ref={instances} args={[undefined, undefined, ASTEROID_COUNT]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={getSpaceColor("dust")}
          roughness={1}
          metalness={0}
        />
      </instancedMesh>
    </group>
  );
}
