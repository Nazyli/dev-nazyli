"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  CAMERA_POSITION_STOPS,
  CAMERA_TARGET_STOPS,
  cameraPath,
  cameraTargetPath,
  mapScrollProgressToCameraPath,
} from "@/lib/cameraPath";
import { universeState } from "@/lib/universeState";
import { useAmbientMotionPaused } from "@/hooks/useAmbientMotionPaused";

const tmpPosition = new THREE.Vector3();
const tmpTarget = new THREE.Vector3();

export function SpaceCamera() {
  const hasMoved = useRef(false);
  const smoothedTarget = useRef(new THREE.Vector3());
  const invalidate = useThree((state) => state.invalidate);
  const ambientMotionPaused = useAmbientMotionPaused();

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      universeState.mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      universeState.mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
      if (ambientMotionPaused) invalidate();
    };
    const onScroll = () => invalidate();

    window.addEventListener("pointermove", onPointerMove);
    if (ambientMotionPaused) {
      window.addEventListener("scroll", onScroll, { passive: true });
      invalidate();
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, [ambientMotionPaused, invalidate]);

  useFrame((state, delta) => {
    const camera = state.camera;
    const reducedMotion = universeState.reducedMotion;
    if (reducedMotion) {
      if (!hasMoved.current) {
        cameraPath.getPointAt(0, tmpPosition);
        cameraTargetPath.getPointAt(0, tmpTarget);
        camera.position.copy(tmpPosition);
        smoothedTarget.current.copy(tmpTarget);
        camera.lookAt(tmpTarget);
      }
      return;
    }

    cameraPath.getPointAt(
      mapScrollProgressToCameraPath(
        universeState.progress,
        CAMERA_POSITION_STOPS,
      ),
      tmpPosition,
    );
    cameraTargetPath.getPointAt(
      mapScrollProgressToCameraPath(
        universeState.progress,
        CAMERA_TARGET_STOPS,
      ),
      tmpTarget,
    );

    if (!hasMoved.current) {
      camera.position.copy(tmpPosition);
      smoothedTarget.current.copy(tmpTarget);
      hasMoved.current = true;
    }

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
    smoothedTarget.current.x = THREE.MathUtils.damp(
      smoothedTarget.current.x,
      tmpTarget.x,
      6,
      delta,
    );
    smoothedTarget.current.y = THREE.MathUtils.damp(
      smoothedTarget.current.y,
      tmpTarget.y,
      6,
      delta,
    );
    smoothedTarget.current.z = THREE.MathUtils.damp(
      smoothedTarget.current.z,
      tmpTarget.z,
      6,
      delta,
    );
    if (
      ambientMotionPaused &&
      camera.position.distanceToSquared(tmpPosition) > 0.0001
    ) {
      state.invalidate();
    }

    tmpTarget.copy(smoothedTarget.current);
    tmpTarget.x += universeState.mouseX * 0.6;
    tmpTarget.y += universeState.mouseY * 0.4;
    camera.lookAt(tmpTarget);
  });

  return null;
}
