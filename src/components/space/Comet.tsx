"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";

const SEMI_MAJOR_AXIS = 76;
const ECCENTRICITY = 0.28;
const INITIAL_PHASE = 1.17;
const ORBIT_SPEED = 0.003;
const UP = new THREE.Vector3(0, 1, 0);
const cometPosition = new THREE.Vector3();
const awayFromSun = new THREE.Vector3();
const tailAxis = new THREE.Vector3();

function makeComaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(64, 64, 1, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,0.85)");
  gradient.addColorStop(0.12, "rgba(205,239,255,0.54)");
  gradient.addColorStop(0.38, "rgba(119,202,232,0.16)");
  gradient.addColorStop(0.72, "rgba(83,163,205,0.035)");
  gradient.addColorStop(1, "rgba(83,163,205,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function Comet() {
  const body = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const coma = useRef<THREE.SpriteMaterial>(null);
  const phase = useRef(INITIAL_PHASE);
  const texture = useMemo(() => makeComaTexture(), []);

  useEffect(() => () => texture?.dispose(), [texture]);

  useFrame((state, delta) => {
    if (!body.current || !tail.current) return;
    if (!universeState.reducedMotion && !universeState.ambientMotionPaused) {
      phase.current += delta * ORBIT_SPEED;
    }

    const eccentricAnomaly = phase.current;
    cometPosition.set(
      SEMI_MAJOR_AXIS * (Math.cos(eccentricAnomaly) - ECCENTRICITY),
      -11 + Math.sin(eccentricAnomaly) * 2.8,
      SEMI_MAJOR_AXIS * Math.sqrt(1 - ECCENTRICITY ** 2) * Math.sin(eccentricAnomaly),
    );
    body.current.position.copy(cometPosition);

    awayFromSun.copy(cometPosition).normalize();
    tailAxis.copy(awayFromSun).negate();
    tail.current.quaternion.setFromUnitVectors(UP, tailAxis);

    const distance = cometPosition.length();
    const nearSun = 1 - THREE.MathUtils.clamp((distance - 54) / 44, 0, 1);
    const tailLength = THREE.MathUtils.lerp(14, 24, nearSun);
    tail.current.scale.set(1, tailLength / 18, 1);
    if (coma.current) coma.current.opacity = 0.34 + nearSun * 0.28;
  });

  return (
    <group ref={body}>
      <group ref={tail}>
        <mesh position={[0, -9, 0]}>
          <coneGeometry args={[1.05, 18, 20, 1, true]} />
          <meshBasicMaterial
            color={getSpaceColor("gold-muted")}
            transparent
            opacity={0.075}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, -7, 0]}>
          <coneGeometry args={[0.34, 14, 16, 1, true]} />
          <meshBasicMaterial
            color={getSpaceColor("planet-ice")}
            transparent
            opacity={0.11}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
      <sprite scale={[3.8, 3.8, 1]} renderOrder={1}>
        <spriteMaterial
          ref={coma}
          map={texture ?? undefined}
          color={getSpaceColor("planet-ice")}
          transparent
          opacity={0.48}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <mesh>
        <sphereGeometry args={[0.28, 20, 16]} />
        <meshStandardMaterial
          color={getSpaceColor("planet-ice")}
          emissive={getSpaceColor("planet-aqua")}
          emissiveIntensity={0.22}
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>
    </group>
  );
}
