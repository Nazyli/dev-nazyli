"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";

const LIFE = 1;
const TRAVEL = 34;
const UNIT_X = new THREE.Vector3(1, 0, 0);
const temp = new THREE.Vector3();

export function ShootingStar() {
  const mesh = useRef<THREE.Mesh>(null);
  const active = useRef(false);
  const elapsed = useRef(0);
  const countdown = useRef(5);
  const from = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (universeState.reducedMotion || !mesh.current) return;

    if (!active.current) {
      countdown.current -= delta;
      if (countdown.current > 0) return;

      from.current.set(
        (Math.random() - 0.5) * 46,
        6 + Math.random() * 12,
        -34 + Math.random() * 24
      );
      dir.current
        .set(
          (Math.random() - 0.5) * 0.5,
          -0.5 - Math.random() * 0.35,
          0.25 + Math.random() * 0.45
        )
        .normalize();

      active.current = true;
      elapsed.current = 0;
      return;
    }

    elapsed.current += delta;
    const k = elapsed.current / LIFE;

    if (k >= 1) {
      active.current = false;
      countdown.current = 7 + Math.random() * 12;
      mesh.current.visible = false;
      return;
    }

    temp.copy(from.current).addScaledVector(dir.current, k * TRAVEL);
    mesh.current.position.copy(temp);
    mesh.current.quaternion.setFromUnitVectors(UNIT_X, dir.current);

    const material = mesh.current.material as THREE.MeshBasicMaterial;
    material.opacity = (1 - k * k) * 0.9;
  });

  return (
    <mesh ref={mesh} visible={false}>
      <boxGeometry args={[2.4, 0.03, 0.03]} />
      <meshBasicMaterial color="#f5efe0" transparent opacity={0} />
    </mesh>
  );
}
