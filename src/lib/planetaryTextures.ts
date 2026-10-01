import * as THREE from "three";
import { createSeededRandom } from "@/lib/random";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";

export type PlanetSurfaceStyle = "rocky" | "clouded" | "banded" | "icy" | "stormy";

export type PlanetSurfaceTextures = {
  color: THREE.CanvasTexture;
  height: THREE.CanvasTexture;
  clouds: THREE.CanvasTexture | null;
};

const WIDTH = 512;
const HEIGHT = 256;

type RGB = [number, number, number];

function readTokenColor(token: SpaceColorToken): RGB {
  const value = getSpaceColor(token).replace("#", "");
  const expanded = value.length === 3
    ? value.split("").map((part) => part + part).join("")
    : value;
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
}

function mix(a: RGB, b: RGB, amount: number): RGB {
  const t = THREE.MathUtils.clamp(amount, 0, 1);
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], t)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], t)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], t)),
  ];
}

function rgba(color: RGB, alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash(x: number, y: number, seed: number) {
  let value = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, seed: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const top = THREE.MathUtils.lerp(
    hash(ix, iy, seed),
    hash(ix + 1, iy, seed),
    sx,
  );
  const bottom = THREE.MathUtils.lerp(
    hash(ix, iy + 1, seed),
    hash(ix + 1, iy + 1, seed),
    sx,
  );
  return THREE.MathUtils.lerp(top, bottom, sy);
}

function periodicNoise(u: number, v: number, frequency: number, seed: number) {
  const angle = u * Math.PI * 2;
  const cosine = Math.cos(angle) * frequency;
  const sine = Math.sin(angle) * frequency;
  return (
    valueNoise(cosine + 37, v * frequency + 13, seed) +
    valueNoise(sine + 89, v * frequency + 61, seed ^ 0x45d9f3b)
  ) * 0.5;
}

function fractalNoise(u: number, v: number, seed: number, startFrequency = 2) {
  let amplitude = 0.56;
  let frequency = startFrequency;
  let sum = 0;
  let weight = 0;
  for (let octave = 0; octave < 3; octave += 1) {
    sum += periodicNoise(u, v, frequency, seed + octave * 92821) * amplitude;
    weight += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return sum / weight;
}

function makeCanvasTexture(canvas: HTMLCanvasElement, color = true) {
  const texture = new THREE.CanvasTexture(canvas);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function stampCraters(
  context: CanvasRenderingContext2D,
  random: () => number,
  dark: RGB,
  light: RGB,
  count: number,
) {
  context.save();
  for (let index = 0; index < count; index += 1) {
    const x = random() * WIDTH;
    const y = 22 + random() * (HEIGHT - 44);
    const radius = 2 + random() * (index < 8 ? 15 : 8);
    const offsets = [x < radius ? WIDTH : 0, x > WIDTH - radius ? -WIDTH : 0];
    for (const offset of [0, ...offsets.filter(Boolean)]) {
      const centerX = x + offset;
      const gradient = context.createRadialGradient(
        centerX - radius * 0.22,
        y - radius * 0.2,
        radius * 0.08,
        centerX,
        y,
        radius,
      );
      gradient.addColorStop(0, rgba(dark, 0.52));
      gradient.addColorStop(0.68, rgba(dark, 0.28));
      gradient.addColorStop(0.86, rgba(light, 0.45));
      gradient.addColorStop(1, rgba(dark, 0));
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(centerX, y, radius, radius * (0.72 + random() * 0.28), 0, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function stampGreatStorm(context: CanvasRenderingContext2D, color: RGB) {
  const stormX = WIDTH * 0.34;
  const stormY = HEIGHT * 0.62;
  context.save();
  context.translate(stormX, stormY);
  context.rotate(-0.12);
  const glow = context.createRadialGradient(0, 0, 2, 0, 0, 42);
  glow.addColorStop(0, rgba(color, 0.75));
  glow.addColorStop(0.48, rgba(color, 0.58));
  glow.addColorStop(1, rgba(color, 0));
  context.fillStyle = glow;
  context.beginPath();
  context.ellipse(0, 0, 42, 18, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = rgba(color, 0.55);
  context.lineWidth = 2;
  for (let ring = 0; ring < 3; ring += 1) {
    context.beginPath();
    context.ellipse(0, 0, 15 + ring * 8, 5 + ring * 4, 0, 0.15, Math.PI * 1.72);
    context.stroke();
  }
  context.restore();
}

export function makePlanetSurfaceTextures(
  style: PlanetSurfaceStyle,
  seed: number,
  palette: [SpaceColorToken, SpaceColorToken, SpaceColorToken],
): PlanetSurfaceTextures {
  const colors = palette.map(readTokenColor) as [RGB, RGB, RGB];
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = WIDTH;
  colorCanvas.height = HEIGHT;
  const colorContext = colorCanvas.getContext("2d");
  if (!colorContext) throw new Error("2d context unavailable");
  const colorImage = colorContext.createImageData(WIDTH, HEIGHT);

  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = WIDTH;
  heightCanvas.height = HEIGHT;
  const heightContext = heightCanvas.getContext("2d");
  if (!heightContext) throw new Error("2d context unavailable");
  const heightImage = heightContext.createImageData(WIDTH, HEIGHT);

  const cloudCanvas = document.createElement("canvas");
  cloudCanvas.width = WIDTH;
  cloudCanvas.height = HEIGHT;
  const cloudContext = cloudCanvas.getContext("2d");
  if (!cloudContext) throw new Error("2d context unavailable");
  const cloudImage = cloudContext.createImageData(WIDTH, HEIGHT);

  for (let y = 0; y < HEIGHT; y += 1) {
    const v = y / HEIGHT;
    const latitude = (v - 0.5) * 2;
    for (let x = 0; x < WIDTH; x += 1) {
      const u = x / WIDTH;
      const warped = fractalNoise(u, v, seed, 2) - 0.5;
      const detail = periodicNoise(u, v, 15, seed ^ 0x6d2b79f5) - 0.5;
      const fine = periodicNoise(u, v, 48, seed ^ 0x1b873593) - 0.5;
      let elevation = 0.5;
      let cloud = 0;
      let surfaceColor: RGB;

      if (style === "rocky") {
        const terrain = THREE.MathUtils.clamp(0.5 + warped * 1.55 + detail * 0.34, 0, 1);
        elevation = THREE.MathUtils.clamp(terrain + fine * 0.1, 0, 1);
        surfaceColor = mix(
          mix(colors[0], colors[1], smoothstep(0.12, 0.56, terrain)),
          colors[2],
          smoothstep(0.62, 0.94, terrain) * 0.55,
        );
        surfaceColor = mix(surfaceColor, colors[0], Math.max(0, -detail) * 0.12);
      } else if (style === "clouded") {
        const flow = 0.5 + warped * 1.2 + Math.sin(latitude * 8 + warped * 5) * 0.12;
        cloud = smoothstep(0.38, 0.68, flow + detail * 0.35);
        elevation = THREE.MathUtils.clamp(0.52 + warped * 0.5 + detail * 0.12, 0, 1);
        surfaceColor = mix(colors[0], colors[1], smoothstep(0.24, 0.74, flow));
        surfaceColor = mix(surfaceColor, colors[2], cloud * 0.62);
      } else if (style === "banded") {
        const flow = 0.5 + Math.sin((v + warped * 0.095) * Math.PI * 34 + Math.sin(u * Math.PI * 8) * 0.24) * 0.5;
        const bands = THREE.MathUtils.clamp(flow + detail * 0.25, 0, 1);
        elevation = THREE.MathUtils.clamp(0.52 + (bands - 0.5) * 0.62 + fine * 0.08, 0, 1);
        surfaceColor = mix(colors[0], colors[1], smoothstep(0.18, 0.64, bands));
        surfaceColor = mix(surfaceColor, colors[2], smoothstep(0.65, 0.95, bands) * 0.78);
        cloud = smoothstep(0.56, 0.82, bands + detail * 0.3);
      } else {
        const bandFrequency = style === "stormy" ? 22 : 13;
        const flow = 0.5 + Math.sin((v + warped * 0.13) * Math.PI * bandFrequency + detail * 1.4) * 0.5;
        const mottling = THREE.MathUtils.clamp(flow * 0.54 + warped * 0.48 + detail * 0.2 + 0.5, 0, 1);
        elevation = THREE.MathUtils.clamp(0.5 + warped * 0.28 + flow * 0.08, 0, 1);
        surfaceColor = mix(colors[0], colors[1], smoothstep(0.14, 0.7, mottling));
        surfaceColor = mix(surfaceColor, colors[2], smoothstep(0.68, 0.98, mottling) * (style === "stormy" ? 0.82 : 0.55));
        cloud = smoothstep(0.65, 0.88, mottling + detail * 0.22);
      }

      const index = (y * WIDTH + x) * 4;
      colorImage.data[index] = surfaceColor[0];
      colorImage.data[index + 1] = surfaceColor[1];
      colorImage.data[index + 2] = surfaceColor[2];
      colorImage.data[index + 3] = 255;
      const height = Math.round(elevation * 255);
      heightImage.data[index] = height;
      heightImage.data[index + 1] = height;
      heightImage.data[index + 2] = height;
      heightImage.data[index + 3] = 255;
      cloudImage.data[index] = 245;
      cloudImage.data[index + 1] = 239;
      cloudImage.data[index + 2] = 224;
      cloudImage.data[index + 3] = Math.round(cloud * 210);
    }
  }

  colorContext.putImageData(colorImage, 0, 0);
  heightContext.putImageData(heightImage, 0, 0);
  cloudContext.putImageData(cloudImage, 0, 0);

  if (style === "rocky") {
    const random = createSeededRandom(seed ^ 0x4f1bbcdc);
    stampCraters(colorContext, random, colors[0], colors[2], seed === 1101 ? 46 : 26);
    stampCraters(heightContext, createSeededRandom(seed ^ 0x4f1bbcdc), [36, 36, 36], [224, 224, 224], seed === 1101 ? 46 : 26);
  }
  if (style === "banded" || style === "stormy") {
    stampGreatStorm(colorContext, colors[2]);
  }

  const color = makeCanvasTexture(colorCanvas);
  const height = makeCanvasTexture(heightCanvas, false);
  const clouds = ["clouded", "banded", "icy", "stormy"].includes(style)
    ? makeCanvasTexture(cloudCanvas)
    : null;

  return { color, height, clouds };
}
