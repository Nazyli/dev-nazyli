"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";
import {
  EARTH_CLOUD_URL,
  EARTH_TEXTURE_URL,
  makeCloudTexture,
  makeEarthBumpTexture,
  makeEarthTexture,
} from "@/lib/textures";

type EarthProps = {
  position?: [number, number, number];
  radius?: number;
};

function Atmosphere({ radius }: { radius: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color(getSpaceColor("accent")) },
          uIntensity: { value: 0.6 },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 uColor;
          uniform float uIntensity;
          void main() {
            float f = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 3.0);
            gl_FragColor = vec4(uColor, f * uIntensity);
          }
        `,
      }),
    []
  );

  return (
    <mesh material={material} scale={1.05}>
      <sphereGeometry args={[radius, 48, 48]} />
    </mesh>
  );
}

export function Earth({ position = [0, 2.2, 80], radius = 5.5 }: EarthProps) {
  const group = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const spin = useRef(0);

  const earthMap = useMemo(
    () => (EARTH_TEXTURE_URL ? null : makeEarthTexture()),
    []
  );
  const earthBump = useMemo(() => makeEarthBumpTexture(), []);
  const cloudMap = useMemo(
    () => (EARTH_CLOUD_URL ? null : makeCloudTexture()),
    []
  );

  useEffect(
    () => () => {
      earthMap?.dispose();
      earthBump.dispose();
      cloudMap?.dispose();
    },
    [cloudMap, earthBump, earthMap],
  );

  useFrame((_, delta) => {
    if (universeState.reducedMotion) {
      if (group.current) {
        group.current.position.x = -55;
        group.current.scale.setScalar(0.6);
      }
      return;
    }
    if (!universeState.ambientMotionPaused) spin.current += delta * 0.05;
    const tiltX = universeState.mouseY * 0.25;
    const tiltY = universeState.mouseX * 0.4;
    if (group.current) {
      const progress = THREE.MathUtils.clamp(universeState.progress, 0, 1);
      const arrival = THREE.MathUtils.lerp(0.6, 1, progress);
      group.current.position.x = THREE.MathUtils.lerp(-55, 0, progress);
      group.current.scale.setScalar(arrival);
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        tiltX,
        3,
        delta
      );
      group.current.rotation.y = spin.current + tiltY;
    }
    if (cloudRef.current && !universeState.ambientMotionPaused) {
      cloudRef.current.rotation.y += delta * 0.006;
    }
  });

  return (
    <group position={position}>
      <group ref={group}>
        <mesh rotation={[0.2, 0, 0]}>
          <sphereGeometry args={[radius, 64, 64]} />
          <meshStandardMaterial
            map={earthMap ?? undefined}
            bumpMap={earthBump}
            bumpScale={0.5}
            emissive={getSpaceColor("starlight")}
            emissiveMap={earthMap ?? undefined}
            emissiveIntensity={0.7}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
        {cloudMap && (
          <mesh ref={cloudRef} scale={1.012}>
            <sphereGeometry args={[radius, 48, 48]} />
            <meshBasicMaterial
              map={cloudMap}
              transparent
              opacity={0.35}
              depthWrite={false}
            />
          </mesh>
        )}
        <Atmosphere radius={radius} />
      </group>
    </group>
  );
}
