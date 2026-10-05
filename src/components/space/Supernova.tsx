"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";

const EVENT_DURATION = 3.6;
const UP = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3();
const lateral = new THREE.Vector3();
const vertical = new THREE.Vector3();
const origin = new THREE.Vector3();

function makeCoreTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.08, "rgba(255,248,225,0.98)");
  gradient.addColorStop(0.2, "rgba(255,221,157,0.8)");
  gradient.addColorStop(0.46, "rgba(236,160,103,0.28)");
  gradient.addColorStop(1, "rgba(191,118,230,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeShellMaterial(warm: string, cool: string, opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uWarm: { value: new THREE.Color(warm) },
      uCool: { value: new THREE.Color(cool) },
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
      uniform vec3 uWarm;
      uniform vec3 uCool;
      uniform float uOpacity;
      uniform float uPhase;
      varying vec2 vUv;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float valueNoise(vec2 p) {
        vec2 cell = floor(p);
        vec2 blend = fract(p);
        blend = blend * blend * (3.0 - 2.0 * blend);
        return mix(
          mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
          mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), blend.x),
          blend.y
        );
      }
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int octave = 0; octave < 4; octave++) {
          value += valueNoise(p) * amplitude;
          p = p * 2.03 + vec2(17.1, 9.2);
          amplitude *= 0.5;
        }
        return value;
      }
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float radius = length(p);
        float cloud = fbm(p * 4.2 + vec2(uPhase * 0.04, -uPhase * 0.025));
        float filaments = 1.0 - abs(2.0 * fbm(p * 13.0 + vec2(2.4, uPhase * 0.03)) - 1.0);
        float knots = fbm(p * 24.0 + vec2(-uPhase * 0.02, 5.1));
        float warpedRadius = radius + (cloud - 0.5) * 0.14;
        float interior = (1.0 - smoothstep(0.62, 1.02, warpedRadius))
          * smoothstep(0.22, 0.48, warpedRadius);
        float filamentMask = smoothstep(0.48, 0.82, filaments) * (0.35 + knots * 0.65);
        float frontDistance = (warpedRadius - (0.84 + (cloud - 0.5) * 0.08)) / 0.075;
        float shockFront = exp(-(frontDistance * frontDistance));
        float density = interior * (0.08 + filamentMask * 0.72 + cloud * 0.18)
          + shockFront * (0.16 + filamentMask * 0.62);
        float heat = clamp(0.16 + cloud * 0.62 + knots * 0.3, 0.0, 1.0);
        vec3 color = mix(uCool, uWarm, heat);
        gl_FragColor = vec4(color, density * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function setMaterialOpacity(material: THREE.Material | THREE.Material[], opacity: number, phase: number) {
  if (Array.isArray(material) || !(material instanceof THREE.ShaderMaterial)) return;
  material.uniforms.uOpacity.value = opacity;
  material.uniforms.uPhase.value = phase;
}

export function Supernova() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.SpriteMaterial>(null);
  const coreSprite = useRef<THREE.Sprite>(null);
  const shell = useRef<THREE.Mesh>(null);
  const innerShell = useRef<THREE.Mesh>(null);
  const active = useRef(false);
  const elapsed = useRef(0);
  const countdown = useRef(2.6);
  const phase = useRef(0);

  const coreTexture = useMemo(() => makeCoreTexture(), []);
  const shellGeometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const shellMaterial = useMemo(
    () => makeShellMaterial(getSpaceColor("gold"), getSpaceColor("planet-ochre"), 0),
    [],
  );
  const innerShellMaterial = useMemo(
    () => makeShellMaterial(getSpaceColor("planet-ice"), getSpaceColor("nebula-violet"), 0),
    [],
  );

  useEffect(() => () => {
    coreTexture?.dispose();
    shellGeometry.dispose();
    shellMaterial.dispose();
    innerShellMaterial.dispose();
  }, [coreTexture, shellGeometry, shellMaterial, innerShellMaterial]);

  useFrame((state, delta) => {
    if (!group.current || !coreTexture) return;
    if (universeState.reducedMotion) {
      group.current.visible = false;
      active.current = false;
      elapsed.current = 0;
      countdown.current = 2.6;
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
      vertical.crossVectors(lateral, forward).normalize();

      const distance = 38 + Math.random() * 8;
      const halfHeight = distance * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const halfWidth = halfHeight * camera.aspect;
      origin.copy(camera.position).addScaledVector(forward, distance)
        .addScaledVector(lateral, (Math.random() - 0.5) * halfWidth * 1.35)
        .addScaledVector(vertical, (Math.random() - 0.5) * halfHeight * 1.3);

      group.current.position.copy(origin);
      group.current.quaternion.copy(camera.quaternion);
      group.current.visible = true;
      active.current = true;
      elapsed.current = 0;
      phase.current = Math.random() * Math.PI * 2;
      return;
    }

    elapsed.current += frameDelta;
    const progress = elapsed.current / EVENT_DURATION;
    if (progress >= 1) {
      active.current = false;
      countdown.current = 8 + Math.random() * 7 - EVENT_DURATION;
      group.current.visible = false;
      return;
    }

    const rise = THREE.MathUtils.smoothstep(progress, 0, 0.055);
    const flash = 1 - THREE.MathUtils.smoothstep(progress, 0.12, 0.38);
    const afterglow = 1 - THREE.MathUtils.smoothstep(progress, 0.42, 1);
    const frontTravel = THREE.MathUtils.smoothstep(progress, 0.015, 0.72);

    if (core.current) {
      core.current.opacity = rise * (flash * 0.96 + afterglow * 0.17);
      const coreSize = 0.18 + flash * 1.05 + afterglow * 0.17;
      coreSprite.current?.scale.setScalar(coreSize);
    }
    if (shell.current) {
      const radius = 0.18 + frontTravel * 5.3;
      shell.current.scale.setScalar(radius);
      setMaterialOpacity(shell.current.material, rise * (0.78 * flash + 0.16 * afterglow), phase.current + progress * 1.8);
    }
    if (innerShell.current) {
      const radius = 0.12 + THREE.MathUtils.smoothstep(progress, 0.1, 0.82) * 4.4;
      innerShell.current.scale.setScalar(radius);
      setMaterialOpacity(innerShell.current.material, rise * (0.35 * flash + 0.11 * afterglow), phase.current + progress * 1.2 + 1.4);
    }
  });

  if (!coreTexture) return null;

  return (
    <group ref={group} visible={false}>
      <mesh ref={shell} geometry={shellGeometry} material={shellMaterial} frustumCulled={false} />
      <mesh ref={innerShell} geometry={shellGeometry} material={innerShellMaterial} frustumCulled={false} />
      <sprite ref={coreSprite} scale={[0.18, 0.18, 1]}>
        <spriteMaterial
          ref={core}
          map={coreTexture}
          color={getSpaceColor("starlight")}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}
