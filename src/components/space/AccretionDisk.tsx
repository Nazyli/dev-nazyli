"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { universeState } from "@/lib/universeState";
import { getSpaceColor } from "@/lib/spaceColors";

const INNER = 1.4;
const OUTER = 6.0;
const POSITION_Z = -24;
const HERO_CAMERA_DISTANCE = 22;
const HERO_FOV = 55;

const diskVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFragmentShader = `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += vec2(dot(p, p + vec2(45.32)));
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(17.1);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float radius = length(p);
    float angle = atan(p.y, p.x);
    float innerFade = smoothstep(0.22, 0.32, radius);
    float outerFade = 1.0 - smoothstep(0.82, 1.0, radius);
    float warp = fbm(vec2(angle * 1.8 + radius * 3.6 + uSeed, radius * 8.0 - uTime * 0.12));
    float clouds = fbm(vec2(angle * 2.2 + radius * 5.4 + uSeed, radius * 10.0 - uTime * 0.2));
    float filaments = sin(angle * 5.0 + radius * 22.0 - uTime * 0.32 + warp * 6.0);
    filaments = pow(max(filaments, 0.0), 12.0);
    float arcs = sin(angle * 2.0 + radius * 11.0 - uTime * 0.2 + warp * 3.0);
    arcs = pow(max(arcs, 0.0), 16.0);

    float density = smoothstep(0.2, 0.8, clouds);
    float heat = 1.0 - smoothstep(0.24, 0.78, radius);
    vec3 color = mix(vec3(0.12, 0.008, 0.024), vec3(0.78, 0.055, 0.012), smoothstep(0.2, 0.72, clouds));
    color = mix(color, vec3(1.0, 0.24, 0.022), smoothstep(0.15, 0.8, density + filaments * 0.35));
    color = mix(color, vec3(1.0, 0.68, 0.26), clamp(heat * 0.52 + filaments * 0.72, 0.0, 0.92));
    color = mix(color, vec3(1.0, 0.96, 0.78), smoothstep(0.68, 1.08, heat + filaments * 0.62) * 0.78);
    color += vec3(1.0, 0.22, 0.035) * arcs * 1.25;

    float opacity = innerFade * outerFade * (0.11 + density * 0.34 + filaments * 0.46 + arcs * 0.16);
    gl_FragColor = vec4(color, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function AccretionDisk({
  rotation = [0.82, 0.5, 0.12] as [number, number, number],
}) {
  const spin = useRef<THREE.Group>(null);
  const companionOrbit = useRef<THREE.Group>(null);
  const primaryDisk = useRef<THREE.ShaderMaterial>(null);
  const companionDisk = useRef<THREE.ShaderMaterial>(null);
  const motionTime = useRef(0);
  const primaryUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSeed: { value: 0.0 },
  }), []);
  const companionUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSeed: { value: 8.27 },
  }), []);
  const aspect = useThree((state) => state.size.width / state.size.height);
  const portrait = THREE.MathUtils.clamp((1.15 - aspect) / 0.7, 0, 1);
  const targetHorizontalPosition = THREE.MathUtils.lerp(0.47, 0.22, portrait);
  const viewHalfWidth =
    HERO_CAMERA_DISTANCE * Math.tan(THREE.MathUtils.degToRad(HERO_FOV / 2)) * aspect;
  const position: [number, number, number] = [
    viewHalfWidth * targetHorizontalPosition,
    THREE.MathUtils.lerp(-3.8, 7.4, portrait),
    POSITION_Z,
  ];
  const scale = THREE.MathUtils.lerp(1.14, 0.64, portrait);

  useFrame((_, delta) => {
    if (
      universeState.reducedMotion ||
      universeState.ambientMotionPaused ||
      !spin.current ||
      !companionOrbit.current ||
      !primaryDisk.current ||
      !companionDisk.current
    ) return;
    motionTime.current += delta;
    primaryDisk.current.uniforms.uTime.value = motionTime.current;
    companionDisk.current.uniforms.uTime.value = motionTime.current * 1.3;
    spin.current.rotation.z += delta * 0.009;
    companionOrbit.current.rotation.z += delta * 0.018;
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={spin}>
        <mesh>
          <ringGeometry args={[INNER, OUTER, 128, 48]} />
          <shaderMaterial
            ref={primaryDisk}
            uniforms={primaryUniforms}
            vertexShader={diskVertexShader}
            fragmentShader={diskFragmentShader}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[1.08, 64, 48]} />
          <meshBasicMaterial color={getSpaceColor("void")} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <torusGeometry args={[1.14, 0.055, 10, 128]} />
          <meshBasicMaterial
            color={getSpaceColor("planet-cream")}
            transparent
            opacity={0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0, 0, 0.11]}>
          <torusGeometry args={[1.25, 0.018, 8, 128]} />
          <meshBasicMaterial
            color={getSpaceColor("planet-ice")}
            transparent
            opacity={0.68}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <group ref={companionOrbit}>
          <group position={[3.1, 2.1, 0.12]} scale={0.38} rotation={[0.1, 0.14, 0]}>
            <mesh>
              <ringGeometry args={[INNER, OUTER, 96, 32]} />
              <shaderMaterial
                ref={companionDisk}
                uniforms={companionUniforms}
                vertexShader={diskVertexShader}
                fragmentShader={diskFragmentShader}
                transparent
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[1.04, 48, 36]} />
              <meshBasicMaterial color={getSpaceColor("void")} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.06]}>
              <torusGeometry args={[1.1, 0.06, 8, 96]} />
              <meshBasicMaterial
                color={getSpaceColor("planet-cream")}
                transparent
                opacity={0.86}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
