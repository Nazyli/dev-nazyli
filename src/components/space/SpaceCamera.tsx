"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraPath, cameraTargetPath } from "@/lib/cameraPath";
import { universeState } from "@/lib/universeState";

const tmpPosition = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

export function SpaceCamera() {
  const hasMoved = useRef(false);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      universeState.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      universeState.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  useFrame((state, delta) => {
    const camera = state.camera;
    const reducedMotion = universeState.reducedMotion;
    if (reducedMotion) {
      if (!hasMoved.current) {
        cameraPath.getPointAt(0, tmpPosition);
        cameraTargetPath.getPointAt(0, tmpTarget);
        camera.position.copy(tmpPosition);
        camera.lookAt(tmpTarget);
      }
      return;
    }

    hasMoved.current = true;
    const t = universeState.progress;
    cameraPath.getPointAt(t, tmpPosition);
    cameraTargetPath.getPointAt(t, tmpTarget);

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      tmpPosition.x,
      6,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      tmpPosition.y,
      6,
      delta
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      tmpPosition.z,
      6,
      delta
    );

    tmpTarget.x += universeState.mouseX * 0.6;
    tmpTarget.y += universeState.mouseY * 0.4;
    camera.lookAt(tmpTarget);
  });

  return null;
}
