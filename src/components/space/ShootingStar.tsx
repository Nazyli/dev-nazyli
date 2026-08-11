"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";

const LIFE = 1.1;
const TRAVEL = 30;
const UP = new THREE.Vector3(0, 1, 0);

const temp = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const fwd = new THREE.Vector3();
const lateral = new THREE.Vector3();
const up2 = new THREE.Vector3();
const toCam = new THREE.Vector3();
const yAxis = new THREE.Vector3();

function makeStreakTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  grad.addColorStop(0, "rgba(245, 239, 224, 0)");
  grad.addColorStop(0.6, "rgba(245, 239, 224, 0.35)");
  grad.addColorStop(1, "rgba(245, 239, 224, 1)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function ShootingStar() {
  const mesh = useRef<THREE.Mesh>(null);
  const active = useRef(false);
  const elapsed = useRef(0);
  const countdown = useRef(2);
  const origin = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());

  const texture = useMemo(() => makeStreakTexture(), []);

  useFrame((state, delta) => {
    if (universeState.reducedMotion || !mesh.current || !texture) return;
    const camera = state.camera;

    if (!active.current) {
      countdown.current -= delta;
      if (countdown.current > 0) return;

      camera.getWorldDirection(fwd);
      lateral.copy(fwd).cross(UP).normalize();
      up2.copy(fwd).cross(lateral).normalize();

      origin.current
        .copy(camera.position)
        .addScaledVector(fwd, 16 + Math.random() * 20)
        .addScaledVector(lateral, (Math.random() - 0.5) * 18)
        .addScaledVector(up2, (Math.random() - 0.5) * 14);

      dir.current
        .set(
          (Math.random() - 0.5) * 0.4,
          -0.6 - Math.random() * 0.25,
          0.3 + Math.random() * 0.4
        )
        .normalize();

      active.current = true;
      elapsed.current = 0;
      mesh.current.visible = true;
      return;
    }

    elapsed.current += delta;
    const k = elapsed.current / LIFE;

    if (k >= 1) {
      active.current = false;
      countdown.current = 5 + Math.random() * 8;
      mesh.current.visible = false;
      return;
    }

    temp.copy(origin.current).addScaledVector(dir.current, k * TRAVEL);
    mesh.current.position.copy(temp);

    toCam.copy(camera.position).sub(temp);
    if (toCam.lengthSq() > 1e-6) {
      toCam.addScaledVector(dir.current, -toCam.dot(dir.current));
      if (toCam.lengthSq() > 1e-6) {
        toCam.normalize();
        yAxis.copy(toCam).cross(dir.current);
        tempMatrix.makeBasis(dir.current, yAxis, toCam);
        mesh.current.quaternion.setFromRotationMatrix(tempMatrix);
      }
    }

    const material = mesh.current.material as THREE.MeshBasicMaterial;
    material.opacity = Math.pow(1 - k, 1.5);
  });

  if (!texture) return null;

  return (
    <mesh ref={mesh} visible={false}>
      <planeGeometry args={[2.6, 0.07]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
