"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { OPENING_SYSTEM_Z } from "@/lib/planetaryTour";
import { getSpaceColor } from "@/lib/spaceColors";

const SEMI_MAJOR_AXIS = 76;
const ECCENTRICITY = 0.28;
const INITIAL_PHASE = 1.17;
const ORBIT_SPEED = 0.003;
const UP = new THREE.Vector3(0, 1, 0);
const cometPosition = new THREE.Vector3();
const awayFromSun = new THREE.Vector3();

function makeComaTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const image = context.createImageData(canvas.width, canvas.height);
  const centerX = 0.47;
  const centerY = 0.51;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const nx = (x / canvas.width - centerX) * 2;
      const ny = (y / canvas.height - centerY) * 2;
      const angle = Math.atan2(ny, nx);
      const radius = Math.hypot(nx * 0.94, ny * 1.08);
      const lobe = 1 + 0.12 * Math.sin(angle * 3 + 0.8)
        + 0.075 * Math.sin(angle * 7 - 1.6)
        + 0.035 * Math.sin(angle * 13 + radius * 18);
      const warpedRadius = radius / lobe;
      const innerCloud = Math.exp(-warpedRadius * warpedRadius * 24);
      const outerCloud = Math.exp(-warpedRadius * warpedRadius * 7.2);
      const sunwardJet = Math.exp(-((nx + 0.25) ** 2 / 0.018 + (ny - 0.05) ** 2 / 0.075));
      const filament = Math.pow(Math.max(0, Math.sin(angle * 8 + radius * 31 + Math.sin(angle * 3) * 2)), 7)
        * Math.exp(-warpedRadius * 2.2);
      const edge = THREE.MathUtils.smoothstep(0.82 - warpedRadius, 0, 0.28);
      const alpha = Math.min(0.42, (innerCloud * 0.25 + outerCloud * 0.1 + sunwardJet * 0.13 + filament * 0.07) * edge);
      const offset = (y * canvas.width + x) * 4;
      image.data[offset] = 171 + Math.round(68 * innerCloud);
      image.data[offset + 1] = 213 + Math.round(39 * innerCloud);
      image.data[offset + 2] = 232 + Math.round(23 * innerCloud);
      image.data[offset + 3] = Math.round(alpha * 255);
    }
  }
  context.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeNucleusGeometry(radius = 0.42) {
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const vertex = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const direction = vertex.clone().normalize();
    const roughness = 1
      + 0.13 * Math.sin(direction.x * 9 + direction.y * 4)
      + 0.09 * Math.sin(direction.z * 13 - direction.x * 5)
      + 0.045 * Math.cos(direction.y * 17 + direction.z * 3);
    vertex.multiplyScalar(roughness);
    vertex.x *= 1.16;
    vertex.y *= 0.82;
    vertex.z *= 0.94;
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
    const facet = 0.62 + 0.2 * Math.sin(direction.x * 11 + direction.y * 3)
      + 0.15 * Math.cos(direction.z * 17 - direction.x * 5);
    colors[index * 3] = facet * 0.76;
    colors[index * 3 + 1] = facet * 0.88;
    colors[index * 3 + 2] = facet;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const ssOrigin = new THREE.Vector3();
const ssDirection = new THREE.Vector3();
const ssCurve = new THREE.Vector3();
const ssFwd = new THREE.Vector3();
const ssLateral = new THREE.Vector3();
const ssUp = new THREE.Vector3();
const ssPosition = new THREE.Vector3();
const ssAway = new THREE.Vector3();
const ssTailAway = new THREE.Vector3();
const SUN_WORLD = new THREE.Vector3(0, 0, OPENING_SYSTEM_Z);
const DUST_COUNT = 420;

function makeDustSystem() {
  const positions = new Float32Array(DUST_COUNT * 3);
  const colors = new Float32Array(DUST_COUNT * 3);
  const velocities = new Float32Array(DUST_COUNT * 3);
  const ages = new Float32Array(DUST_COUNT).fill(1);
  const lifespans = new Float32Array(DUST_COUNT).fill(1);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return { geometry, positions, colors, velocities, ages, lifespans };
}

function updateFadingDust(
  dust: ReturnType<typeof makeDustSystem>,
  delta: number,
  envelope: number,
) {
  for (let index = 0; index < DUST_COUNT; index += 1) {
    const offset = index * 3;
    if (dust.ages[index] < dust.lifespans[index]) {
      dust.ages[index] += delta;
      dust.positions[offset] += dust.velocities[offset] * delta;
      dust.positions[offset + 1] += dust.velocities[offset + 1] * delta;
      dust.positions[offset + 2] += dust.velocities[offset + 2] * delta;
      const fade = Math.max(0, 1 - dust.ages[index] / dust.lifespans[index]) * envelope;
      dust.colors[offset] = 0.5 * fade;
      dust.colors[offset + 1] = 0.48 * fade;
      dust.colors[offset + 2] = 0.44 * fade;
    } else {
      dust.colors[offset] = 0;
      dust.colors[offset + 1] = 0;
      dust.colors[offset + 2] = 0;
    }
  }
  dust.geometry.getAttribute("position").needsUpdate = true;
  dust.geometry.getAttribute("color").needsUpdate = true;
}

export function SidingSpringComet() {
  const group = useRef<THREE.Group>(null);
  const dustCloud = useRef<THREE.Points>(null);
  const nucleusMesh = useRef<THREE.Mesh>(null);
  const coma = useRef<THREE.SpriteMaterial>(null);
  const comaSprite = useRef<THREE.Sprite>(null);
  const innerComa = useRef<THREE.SpriteMaterial>(null);
  const innerComaSprite = useRef<THREE.Sprite>(null);
  const nucleus = useRef<THREE.MeshStandardMaterial>(null);
  const active = useRef(false);
  const elapsed = useRef(0);
  const duration = useRef(6);
  const countdown = useRef(2);
  const travel = useRef(60);
  const curveAmp = useRef(0);
  const dustFade = useRef(0);
  const pulsePhase = useRef(0);
  const [nucleusTexture, setNucleusTexture] = useState<THREE.Texture | null>(null);
  const texture = useMemo(() => makeComaTexture(), []);
  const nucleusGeometry = useMemo(() => makeNucleusGeometry(0.31), []);
  const dust = useMemo(() => makeDustSystem(), []);
  const dustRef = useRef(dust);

  useEffect(() => {
    let mounted = true;
    new THREE.TextureLoader().loadAsync("/textures/comet/siding-spring-nucleus.png")
      .then((surface) => {
        if (!mounted) {
          surface.dispose();
          return;
        }
        surface.colorSpace = THREE.SRGBColorSpace;
        surface.wrapS = THREE.RepeatWrapping;
        surface.anisotropy = 4;
        setNucleusTexture(surface);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => () => nucleusTexture?.dispose(), [nucleusTexture]);

  useEffect(() => () => {
    texture?.dispose();
    nucleusGeometry.dispose();
    dust.geometry.dispose();
  }, [texture, nucleusGeometry, dust]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const dustData = dustRef.current;
    const frameDelta = Math.min(delta, 0.033);
    if (universeState.reducedMotion) {
      group.current.visible = false;
      if (dustCloud.current) dustCloud.current.visible = false;
      active.current = false;
      elapsed.current = 0;
      countdown.current = 8 + Math.random() * 7;
      return;
    }
    if (universeState.ambientMotionPaused) return;

    const camera = state.camera as THREE.PerspectiveCamera;

    if (!active.current) {
      if (dustFade.current > 0) {
        const fade = dustFade.current / 2.4;
        updateFadingDust(dustData, frameDelta, fade);
        dustFade.current = Math.max(0, dustFade.current - frameDelta);
        if (dustFade.current === 0 && dustCloud.current) dustCloud.current.visible = false;
      }
      countdown.current -= frameDelta;
      if (countdown.current > 0) return;

      camera.getWorldDirection(ssFwd);
      ssLateral.copy(ssFwd).cross(UP).normalize();
      ssUp.copy(ssFwd).cross(ssLateral).normalize();

      const distance = 11 + Math.random() * 3;
      const halfH = distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfW = halfH * camera.aspect;
      const edge = Math.floor(Math.random() * 4);
      const side = Math.random() < 0.5 ? -1 : 1;

      ssOrigin.copy(camera.position).addScaledVector(ssFwd, distance);
      if (edge === 0 || edge === 1) {
        const entry = edge === 0 ? -1 : 1;
        ssOrigin
          .addScaledVector(ssLateral, entry * halfW * 1.15)
          .addScaledVector(ssUp, (Math.random() - 0.5) * 1.4 * halfH);
        ssDirection
          .copy(ssLateral).multiplyScalar(-entry)
          .addScaledVector(ssUp, (Math.random() - 0.5) * 0.9)
          .addScaledVector(ssFwd, (Math.random() - 0.5) * 0.15)
          .normalize();
      } else if (edge === 2 || edge === 3) {
        const entry = edge === 2 ? 1 : -1;
        ssOrigin
          .addScaledVector(ssUp, entry * halfH * 1.15)
          .addScaledVector(ssLateral, (Math.random() - 0.5) * 1.4 * halfW);
        ssDirection
          .copy(ssUp).multiplyScalar(-entry)
          .addScaledVector(ssLateral, (Math.random() - 0.5) * 0.9 + side * 0.35)
          .addScaledVector(ssFwd, (Math.random() - 0.5) * 0.15)
          .normalize();
      }
      if (Math.random() < 0.35) {
        ssDirection
          .addScaledVector(ssUp, (Math.random() - 0.5) * 0.8)
          .addScaledVector(ssLateral, (Math.random() - 0.5) * 0.8)
          .normalize();
      }

      ssCurve
        .copy(ssUp).multiplyScalar(Math.random() - 0.5)
        .addScaledVector(ssFwd, (Math.random() - 0.5) * 0.4)
        .normalize();
      curveAmp.current = 0.12 + Math.random() * 0.32;
      travel.current = 2.5 * Math.max(halfW, halfH);
      duration.current = 5.5 + Math.random() * 1.3;
      dustData.ages.fill(1);
      dustData.colors.fill(0);
      dustData.geometry.getAttribute("color").needsUpdate = true;
      dustFade.current = 0;
      pulsePhase.current = Math.random() * Math.PI * 2;
      active.current = true;
      elapsed.current = 0;
      group.current.position.copy(ssOrigin);
      ssTailAway.copy(ssOrigin).sub(SUN_WORLD).normalize();
      group.current.visible = true;
      if (coma.current) coma.current.opacity = 0.12;
      if (innerComa.current) innerComa.current.opacity = 0.08;
      if (nucleus.current) nucleus.current.opacity = 0.65;
      return;
    }

    elapsed.current += frameDelta;
    const k = elapsed.current / duration.current;

    if (k >= 1) {
      active.current = false;
      countdown.current = 8 + Math.random() * 7 - duration.current;
      group.current.visible = false;
      dustFade.current = 2.4;
      return;
    }

    ssPosition
      .copy(ssOrigin)
      .addScaledVector(ssDirection, k * travel.current)
      .addScaledVector(ssCurve, Math.sin(k * Math.PI) * curveAmp.current);
    group.current.position.copy(ssPosition);
    if (nucleusMesh.current) {
      nucleusMesh.current.rotation.set(elapsed.current * 0.018, elapsed.current * 0.026, elapsed.current * 0.012);
    }
    ssAway.copy(ssTailAway);

    const envelope = THREE.MathUtils.smoothstep(k, 0, 0.15) *
      (1 - THREE.MathUtils.smoothstep(k, 0.7, 1));
    const time = state.clock.elapsedTime;
    const flicker = 0.9
      + 0.055 * Math.sin(time * 2.7 + pulsePhase.current)
      + 0.03 * Math.sin(time * 5.6 + pulsePhase.current * 1.9)
      + 0.015 * Math.sin(time * 11.8 + pulsePhase.current * 0.4);
    if (coma.current) coma.current.opacity = 0.34 * envelope * flicker;
    if (innerComa.current) innerComa.current.opacity = 0.11 * envelope
      * (0.88 + 0.08 * Math.sin(time * 3.1 + pulsePhase.current));
    if (nucleus.current) nucleus.current.opacity = (0.7 + 0.12 * flicker) * envelope;
    if (nucleus.current) nucleus.current.emissiveIntensity = 0.045 + 0.012 * flicker;

    const positions = dustData.geometry.getAttribute("position") as THREE.BufferAttribute;
    const colors = dustData.geometry.getAttribute("color") as THREE.BufferAttribute;
    for (let index = 0; index < DUST_COUNT; index += 1) {
      if (dustData.ages[index] >= dustData.lifespans[index]) {
        const i3 = index * 3;
        dustData.positions[i3] = ssPosition.x + (Math.random() - 0.5) * 0.55;
        dustData.positions[i3 + 1] = ssPosition.y + (Math.random() - 0.5) * 0.55;
        dustData.positions[i3 + 2] = ssPosition.z + (Math.random() - 0.5) * 0.55;
        dustData.velocities[i3] = ssAway.x * (1.2 + Math.random() * 1.8) - ssDirection.x * 0.35 + (Math.random() - 0.5) * 0.4;
        dustData.velocities[i3 + 1] = ssAway.y * (1.2 + Math.random() * 1.8) - ssDirection.y * 0.35 + (Math.random() - 0.5) * 0.4;
        dustData.velocities[i3 + 2] = ssAway.z * (1.2 + Math.random() * 1.8) - ssDirection.z * 0.35 + (Math.random() - 0.5) * 0.4;
        dustData.ages[index] = 0;
        dustData.lifespans[index] = 0.5 + Math.random() * 0.4;
        dustData.colors[i3] = 0;
        dustData.colors[i3 + 1] = 0;
        dustData.colors[i3 + 2] = 0;
      } else {
        const i3 = index * 3;
        dustData.ages[index] += frameDelta;
        dustData.positions[i3] += dustData.velocities[i3] * frameDelta;
        dustData.positions[i3 + 1] += dustData.velocities[i3 + 1] * frameDelta;
        dustData.positions[i3 + 2] += dustData.velocities[i3 + 2] * frameDelta;
        const fade = Math.max(0, 1 - dustData.ages[index] / dustData.lifespans[index]) * envelope;
        dustData.colors[i3] = 0.5 * fade;
        dustData.colors[i3 + 1] = 0.48 * fade;
        dustData.colors[i3 + 2] = 0.44 * fade;
      }
    }
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    if (dustCloud.current) dustCloud.current.visible = true;
  });

  if (!texture) return null;

  return (
    <>
    <group ref={group} visible={false}>
      <sprite ref={comaSprite} scale={[5.2, 4.4, 1]}>
        <spriteMaterial
          ref={coma}
          map={texture}
          color={getSpaceColor("planet-ice")}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <sprite ref={innerComaSprite} position={[0.18, -0.1, 0.06]} scale={[2.7, 1.8, 1]} renderOrder={2}>
        <spriteMaterial
          ref={innerComa}
          map={texture}
          color={getSpaceColor("accent")}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      <mesh ref={nucleusMesh}>
        <primitive object={nucleusGeometry} attach="geometry" />
        <meshStandardMaterial
          ref={nucleus}
          map={nucleusTexture}
          bumpMap={nucleusTexture}
          bumpScale={nucleusTexture ? 0.035 : 0}
          color={getSpaceColor("starlight")}
          vertexColors
          emissive={getSpaceColor("planet-ice")}
          emissiveIntensity={0.055}
          roughness={0.94}
          flatShading
          transparent
          opacity={0}
        />
      </mesh>
    </group>
    <points ref={dustCloud} geometry={dust.geometry} visible={false} frustumCulled={false}>
      <pointsMaterial
        map={texture}
        size={0.24}
        sizeAttenuation
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
    </>
  );
}

export function Comet() {
  const body = useRef<THREE.Group>(null);
  const coma = useRef<THREE.SpriteMaterial>(null);
  const comaSprite = useRef<THREE.Sprite>(null);
  const nucleusMesh = useRef<THREE.Mesh>(null);
  const phase = useRef(INITIAL_PHASE);
  const texture = useMemo(() => makeComaTexture(), []);
  const nucleusGeometry = useMemo(() => makeNucleusGeometry(0.28), []);

  useEffect(() => () => {
    texture?.dispose();
    nucleusGeometry.dispose();
  }, [texture, nucleusGeometry]);

  useFrame((state, delta) => {
    if (!body.current) return;
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

    const distance = cometPosition.length();
    const nearSun = 1 - THREE.MathUtils.clamp((distance - 54) / 44, 0, 1);
    const time = universeState.reducedMotion || universeState.ambientMotionPaused
      ? phase.current * 50
      : state.clock.elapsedTime;
    if (coma.current) coma.current.opacity = (0.3 + nearSun * 0.24)
      * (0.94 + 0.035 * Math.sin(time * 1.7) + 0.025 * Math.sin(time * 3.9 + 1.2));
    if (comaSprite.current) comaSprite.current.rotation.z = 0.035 * Math.sin(time * 0.08);
    if (nucleusMesh.current) {
      nucleusMesh.current.rotation.set(time * 0.018, time * 0.032, time * 0.014);
    }
  });

  return (
    <group ref={body}>
      <sprite ref={comaSprite} scale={[3.8, 3.8, 1]} renderOrder={1}>
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
      <mesh ref={nucleusMesh}>
        <primitive object={nucleusGeometry} attach="geometry" />
        <meshStandardMaterial
          color={getSpaceColor("planet-ice")}
          emissive={getSpaceColor("planet-aqua")}
          emissiveIntensity={0.12}
          roughness={0.94}
          metalness={0.02}
          flatShading
        />
      </mesh>
    </group>
  );
}
