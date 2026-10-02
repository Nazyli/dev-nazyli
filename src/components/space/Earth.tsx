"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";
import {
  disposeGeneratedTexture,
  disposeGeneratedSurfaceTextures,
  loadEarthNightTexture,
  makeTerrestrialSurfaceTextures,
  type PlanetSurfaceTextures,
} from "@/lib/planetaryTextures";

type EarthProps = {
  position?: [number, number, number];
  radius?: number;
  onTexturesReady?: () => void;
};

function makeAtmosphereTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.08)");
  gradient.addColorStop(0.46, "rgba(255,255,255,0.22)");
  gradient.addColorStop(0.56, "rgba(255,255,255,0.17)");
  gradient.addColorStop(0.74, "rgba(255,255,255,0.075)");
  gradient.addColorStop(0.9, "rgba(255,255,255,0.018)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Atmosphere({ radius }: { radius: number }) {
  const texture = useMemo(() => makeAtmosphereTexture(), []);
  useEffect(() => () => disposeGeneratedTexture(texture), [texture]);

  if (!texture) return null;

  return (
    <sprite position={[0, 0, 0]} scale={[radius * 5.2, radius * 5.2, 1]} renderOrder={1}>
      <spriteMaterial
        map={texture}
        color={getSpaceColor("accent")}
        transparent
        opacity={0.72}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </sprite>
  );
}

export function Earth({
  position = [0, 2.2, 80],
  radius = 5.5,
  onTexturesReady,
}: EarthProps) {
  const group = useRef<THREE.Group>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const spin = useRef(0);
  const viewport = useThree((state) => state.size);
  const [surface, setSurface] = useState<PlanetSurfaceTextures | null>(null);
  const [nightMap, setNightMap] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let disposed = false;
    let loadedSurface: PlanetSurfaceTextures | null = null;
    let loadedNightMap: THREE.Texture | null = null;
    const surfaceTask = makeTerrestrialSurfaceTextures().then((result) => {
      loadedSurface = result;
      if (disposed) {
        disposeGeneratedSurfaceTextures([result]);
      } else {
        setSurface(result);
      }
    });
    const nightTask = loadEarthNightTexture().then((texture) => {
      loadedNightMap = texture;
      if (disposed) {
        disposeGeneratedTexture(texture);
      } else {
        setNightMap(texture);
      }
    }).catch(() => {});
    void Promise.allSettled([surfaceTask, nightTask]).then(() => {
      if (!disposed) onTexturesReady?.();
    });
    return () => {
      disposed = true;
      if (loadedSurface) disposeGeneratedSurfaceTextures([loadedSurface]);
      disposeGeneratedTexture(loadedNightMap);
    };
  }, [onTexturesReady]);

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
            key={`${surface ? "surface-ready" : "surface-placeholder"}-${nightMap ? "night-ready" : "night-placeholder"}`}
            map={surface?.color ?? undefined}
            bumpMap={surface?.height ?? undefined}
            bumpScale={0.035}
            color={getSpaceColor(surface ? "starlight" : "planet-aqua")}
            emissive={getSpaceColor("starlight")}
            emissiveMap={nightMap ?? undefined}
            emissiveIntensity={nightMap ? 1.25 : 0.1}
            roughness={0.9}
            metalness={0.05}
          />
        </mesh>
        {surface?.clouds && (
          <mesh ref={cloudRef} scale={1.008}>
            <sphereGeometry args={[radius, 48, 48]} />
            <meshStandardMaterial
              map={surface.cloudsAreAlphaMap ? undefined : surface.clouds}
              alphaMap={surface.cloudsAreAlphaMap ? surface.clouds : undefined}
              color={getSpaceColor("starlight")}
              transparent
              opacity={0.22}
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
