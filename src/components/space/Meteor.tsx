"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";

const UP = new THREE.Vector3(0, 1, 0);
const direction = new THREE.Vector3();
const forward = new THREE.Vector3();
const lateral = new THREE.Vector3();
const vertical = new THREE.Vector3();
const origin = new THREE.Vector3();
const position = new THREE.Vector3();
const toCamera = new THREE.Vector3();
const trailSide = new THREE.Vector3();
const trailUp = new THREE.Vector3();
const trailBasis = new THREE.Matrix4();

function makeMeteorGlow() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.12, "rgba(255,246,219,0.92)");
  gradient.addColorStop(0.34, "rgba(245,190,104,0.36)");
  gradient.addColorStop(1, "rgba(231,127,57,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeTrailMaterial(color: string, opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPhase: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPhase;
      varying vec2 vUv;
      void main() {
        float edge = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
        float taper = pow(max(0.0, vUv.y), 1.45);
        float textureBreakup = 0.78 + 0.22 * sin(vUv.y * 86.0 + uPhase + sin(vUv.y * 17.0));
        float grain = 0.86 + 0.14 * sin(vUv.x * 31.0 + vUv.y * 37.0 + uPhase * 0.12);
        float alpha = edge * taper * textureBreakup * grain * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function setOpacity(material: THREE.Material | THREE.Material[], opacity: number) {
  if (Array.isArray(material)) return;
  if (material instanceof THREE.ShaderMaterial) material.uniforms.uOpacity.value = opacity;
  if (material instanceof THREE.SpriteMaterial || material instanceof THREE.MeshBasicMaterial) {
    material.opacity = opacity;
  }
}

function setPhase(material: THREE.Material | THREE.Material[], phase: number) {
  if (Array.isArray(material)) return;
  if (material instanceof THREE.ShaderMaterial) material.uniforms.uPhase.value = phase;
}

export function Meteor() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.MeshBasicMaterial>(null);
  const sheath = useRef<THREE.MeshBasicMaterial>(null);
  const glow = useRef<THREE.SpriteMaterial>(null);
  const ionTrail = useRef<THREE.Mesh>(null);
  const hotTrail = useRef<THREE.Mesh>(null);
  const coreTrail = useRef<THREE.Mesh>(null);
  const active = useRef(false);
  const elapsed = useRef(0);
  const duration = useRef(2.45);
  const travel = useRef(1);
  const countdown = useRef(1.1);
  const phase = useRef(0);

  const glowTexture = useMemo(() => makeMeteorGlow(), []);
  const ionGeometry = useMemo(() => new THREE.PlaneGeometry(0.34, 4.8, 1, 12), []);
  const hotGeometry = useMemo(() => new THREE.PlaneGeometry(0.24, 2.4, 1, 8), []);
  const coreGeometry = useMemo(() => new THREE.PlaneGeometry(0.1, 1.2, 1, 6), []);
  const ionMaterial = useMemo(() => makeTrailMaterial(getSpaceColor("accent"), 0.36), []);
  const hotMaterial = useMemo(() => makeTrailMaterial(getSpaceColor("gold"), 0.58), []);
  const coreTrailMaterial = useMemo(() => makeTrailMaterial(getSpaceColor("starlight"), 0.82), []);
  const emberGeometry = useMemo(() => new THREE.SphereGeometry(0.018, 6, 5), []);
  const emberMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: getSpaceColor("gold"), toneMapped: false }),
    [],
  );

  useEffect(() => () => {
    glowTexture?.dispose();
    ionGeometry.dispose();
    hotGeometry.dispose();
    coreGeometry.dispose();
    ionMaterial.dispose();
    hotMaterial.dispose();
    coreTrailMaterial.dispose();
    emberGeometry.dispose();
    emberMaterial.dispose();
  }, [glowTexture, ionGeometry, hotGeometry, coreGeometry, ionMaterial, hotMaterial, coreTrailMaterial, emberGeometry, emberMaterial]);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (universeState.reducedMotion) {
      group.current.visible = false;
      active.current = false;
      elapsed.current = 0;
      countdown.current = 1.1;
      return;
    }
    if (universeState.ambientMotionPaused) return;

    const frameDelta = Math.min(delta, 0.04);
    if (!active.current) {
      countdown.current -= frameDelta;
      if (countdown.current > 0) return;

      const camera = state.camera as THREE.PerspectiveCamera;
      camera.getWorldDirection(forward);
      lateral.copy(forward).cross(UP).normalize();
      vertical.copy(forward).cross(lateral).normalize();

      const distance = 14 + Math.random() * 5;
      const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfWidth = halfHeight * camera.aspect;
      const edge = Math.floor(Math.random() * 4);
      origin.copy(camera.position).addScaledVector(forward, distance);

      if (edge < 2) {
        const entry = edge === 0 ? -1 : 1;
        origin
          .addScaledVector(lateral, entry * halfWidth * 1.12)
          .addScaledVector(vertical, (Math.random() - 0.5) * halfHeight * 1.25);
        direction
          .copy(lateral).multiplyScalar(-entry)
          .addScaledVector(vertical, (Math.random() - 0.5) * 0.86)
          .addScaledVector(forward, (Math.random() - 0.5) * 0.08)
          .normalize();
        travel.current = halfWidth * 2.55;
      } else {
        const entry = edge === 2 ? 1 : -1;
        origin
          .addScaledVector(vertical, entry * halfHeight * 1.12)
          .addScaledVector(lateral, (Math.random() - 0.5) * halfWidth * 1.25);
        direction
          .copy(vertical).multiplyScalar(-entry)
          .addScaledVector(lateral, (Math.random() - 0.5) * 0.86)
          .addScaledVector(forward, (Math.random() - 0.5) * 0.08)
          .normalize();
        travel.current = halfHeight * 2.55;
      }

      duration.current = 2.1 + Math.random() * 0.7;
      phase.current = Math.random() * Math.PI * 2;
      elapsed.current = 0;
      active.current = true;
      group.current.position.copy(origin);
      toCamera.copy(camera.position).sub(origin).normalize();
      trailSide.crossVectors(toCamera, direction).normalize();
      if (trailSide.lengthSq() < 1e-5) trailSide.set(1, 0, 0);
      trailUp.crossVectors(direction, trailSide).normalize();
      trailBasis.makeBasis(trailSide, direction, toCamera);
      group.current.quaternion.setFromRotationMatrix(trailBasis);
      group.current.visible = true;
      return;
    }

    elapsed.current += frameDelta;
    const progress = elapsed.current / duration.current;
    if (progress >= 1) {
      active.current = false;
      countdown.current = 8 + Math.random() * 7;
      group.current.visible = false;
      return;
    }

    position.copy(origin).addScaledVector(direction, progress * travel.current);
    group.current.position.copy(position);

    const arrival = THREE.MathUtils.smoothstep(progress, 0, 0.1);
    const fade = 1 - THREE.MathUtils.smoothstep(progress, 0.82, 1);
    const pulse = 0.88 + 0.12 * Math.sin(progress * 29 + phase.current);
    const envelope = arrival * fade * pulse;
    const flash = 0.84 + 0.16 * Math.sin(progress * Math.PI);

    if (core.current) core.current.opacity = envelope * flash;
    if (sheath.current) sheath.current.opacity = envelope * 0.74;
    if (glow.current) glow.current.opacity = envelope * 0.65;
    if (glow.current) glow.current.rotation = Math.sin(progress * 4 + phase.current) * 0.04;
    if (ionTrail.current) setOpacity(ionTrail.current.material, envelope * 0.16);
    if (hotTrail.current) setOpacity(hotTrail.current.material, envelope * 0.32);
    if (coreTrail.current) setOpacity(coreTrail.current.material, envelope * 0.58);

    if (ionTrail.current) setPhase(ionTrail.current.material, phase.current + elapsed.current * 8);
    if (hotTrail.current) setPhase(hotTrail.current.material, phase.current + elapsed.current * 8);
    if (coreTrail.current) setPhase(coreTrail.current.material, phase.current + elapsed.current * 8);
  });

  if (!glowTexture) return null;

  return (
    <group ref={group} visible={false}>
      <mesh ref={ionTrail} geometry={ionGeometry} material={ionMaterial} position={[0, -2.55, 0]} frustumCulled={false} />
      <mesh ref={hotTrail} geometry={hotGeometry} material={hotMaterial} position={[0, -0.85, 0]} frustumCulled={false} />
      <mesh ref={coreTrail} geometry={coreGeometry} material={coreTrailMaterial} position={[0, -0.32, 0]} frustumCulled={false} />
      <mesh>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshBasicMaterial ref={sheath} color={getSpaceColor("gold")} transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.048, 10, 8]} />
        <meshBasicMaterial ref={core} color={getSpaceColor("starlight")} transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <sprite scale={[0.78, 0.78, 1]}>
        <spriteMaterial
          ref={glow}
          map={glowTexture}
          color={getSpaceColor("starlight")}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
      {[0.15, 0.42, 0.68].map((along, index) => (
        <mesh
          key={along}
          geometry={emberGeometry}
          material={emberMaterial}
          position={[(index - 1) * 0.038, -0.35 - along * 1.7, (index % 2 ? 1 : -1) * 0.045]}
        />
      ))}
    </group>
  );
}
