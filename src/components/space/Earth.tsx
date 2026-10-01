"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";
import {
  disposeGeneratedSurfaceTextures,
  makeTerrestrialSurfaceTextures,
  type PlanetSurfaceTextures,
} from "@/lib/planetaryTextures";

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
          uIntensity: { value: 0.32 },
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
  const viewport = useThree((state) => state.size);
  const [surface, setSurface] = useState<PlanetSurfaceTextures | null>(null);

  useEffect(() => {
    let disposed = false;
    let loadedSurface: PlanetSurfaceTextures | null = null;
    void makeTerrestrialSurfaceTextures().then((result) => {
      loadedSurface = result;
      if (disposed) {
        disposeGeneratedSurfaceTextures([result]);
      } else {
        setSurface(result);
      }
    });
    return () => {
      disposed = true;
      if (loadedSurface) disposeGeneratedSurfaceTextures([loadedSurface]);
    };
  }, []);

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
      const portraitLayout = THREE.MathUtils.clamp(
        (1.1 - viewport.width / viewport.height) / 0.64,
        0,
        1,
      );
      const arrival = THREE.MathUtils.lerp(0.6, 1, progress);
      const contactArrival = THREE.MathUtils.smoothstep(progress, 0.84, 0.98);
      group.current.position.x = THREE.MathUtils.lerp(-55, 0, progress);
      group.current.position.y = THREE.MathUtils.lerp(
        0,
        5.5 * portraitLayout,
        contactArrival,
      );
      group.current.scale.setScalar(
        arrival * THREE.MathUtils.lerp(1, 0.82, portraitLayout * contactArrival),
      );
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
            map={surface?.color ?? undefined}
            bumpMap={surface?.height ?? undefined}
            bumpScale={0.035}
            color={getSpaceColor(surface ? "starlight" : "planet-aqua")}
            emissive={getSpaceColor("starlight")}
            emissiveMap={surface?.color ?? undefined}
            emissiveIntensity={0.1}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
        {surface?.clouds && (
          <mesh ref={cloudRef} scale={1.012}>
            <sphereGeometry args={[radius, 48, 48]} />
            <meshStandardMaterial
              map={surface.cloudsAreAlphaMap ? undefined : surface.clouds}
              alphaMap={surface.cloudsAreAlphaMap ? surface.clouds : undefined}
              color={getSpaceColor("starlight")}
              transparent
              opacity={0.28}
              depthWrite={false}
              roughness={1}
              metalness={0}
            />
          </mesh>
        )}
        <Atmosphere radius={radius} />
      </group>
    </group>
  );
}
