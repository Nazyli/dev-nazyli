import * as THREE from "three";
import { createSeededRandom } from "@/lib/random";
import { getSpaceColor, type SpaceColorToken } from "@/lib/spaceColors";
import {
  makeCloudTexture,
  makeEarthBumpTexture,
  makeEarthTexture,
} from "@/lib/textures";
import type { PlanetaryTourBodyName } from "@/lib/planetaryTour";

export type PlanetSurfaceStyle = "rocky" | "clouded" | "banded" | "icy" | "stormy";

export type PlanetSurfaceTextures = {
  color: THREE.Texture;
  height: THREE.Texture | null;
  clouds: THREE.Texture | null;
  cloudsAreAlphaMap?: boolean;
};

const textureLoader = new THREE.TextureLoader();
const loadedTextures = new Map<string, Promise<THREE.Texture>>();

export const PLANET_IMAGE_TEXTURES: Partial<Record<PlanetaryTourBodyName, string>> = {
  Mercury: "/textures/planetary/2k_mercury.webp",
  Venus: "/textures/planetary/2k_venus_surface.webp",
  Earth: "/textures/planetary/2k_earth_daymap.webp",
  Mars: "/textures/planetary/2k_mars.webp",
  Ceres: "/textures/planetary/2k_ceres_fictional.webp",
  Jupiter: "/textures/planetary/2k_jupiter.webp",
  Saturn: "/textures/planetary/2k_saturn.webp",
  Uranus: "/textures/planetary/2k_uranus.webp",
  Neptune: "/textures/planetary/2k_neptune.webp",
  Makemake: "/textures/planetary/2k_makemake_fictional.webp",
};

function loadImageTexture(url: string, color = true) {
  let pending = loadedTextures.get(url);
  if (!pending) {
    pending = textureLoader.loadAsync(url).then((texture) => {
      if (color) texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      texture.userData.sharedPlanetTexture = true;
      return texture;
    });
    loadedTextures.set(url, pending);
    void pending.catch(() => loadedTextures.delete(url));
  }
  return pending;
}

export async function loadPlanetImageTexture(url: string) {
  return loadImageTexture(url);
}

export async function loadPlanetImageSurface(name: PlanetaryTourBodyName): Promise<PlanetSurfaceTextures> {
  const colorUrl = PLANET_IMAGE_TEXTURES[name];
  if (!colorUrl) throw new Error(`No image texture available for ${name}`);

  if (name !== "Earth") {
    return { color: await loadImageTexture(colorUrl), height: null, clouds: null };
  }

  return {
    color: await loadImageTexture(colorUrl),
    height: null,
    clouds: await loadImageTexture("/textures/planetary/2k_earth_clouds.webp", false),
    cloudsAreAlphaMap: true,
  };
}

export async function loadSolarImageTexture() {
  return loadImageTexture("/textures/planetary/2k_sun.webp");
}

export async function loadEarthNightTexture() {
  return loadImageTexture("/textures/planetary/2k_earth_nightmap.webp");
}

export async function preloadPlanetaryImageTextures() {
  const requests = new Map<string, boolean>(
    Object.values(PLANET_IMAGE_TEXTURES)
      .filter((url): url is string => typeof url === "string")
      .map((url) => [url, true]),
  );
  requests.set("/textures/planetary/2k_earth_clouds.webp", false);
  requests.set("/textures/planetary/2k_earth_nightmap.webp", true);
  requests.set("/textures/planetary/2k_moon.webp", true);
  requests.set("/textures/planetary/2k_sun.webp", true);

  await Promise.allSettled(
    [...requests].map(([url, color]) => loadImageTexture(url, color)),
  );
}

export function disposeGeneratedSurfaceTextures(surfaces: PlanetSurfaceTextures[]) {
  surfaces.forEach(({ color, height, clouds }) => {
    for (const texture of [color, height, clouds]) {
      if (texture && !texture.userData.sharedPlanetTexture) texture.dispose();
    }
  });
}

export function disposeGeneratedTexture(texture: THREE.Texture | null) {
  if (texture && !texture.userData.sharedPlanetTexture) texture.dispose();
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

export async function makeTerrestrialSurfaceTextures(): Promise<PlanetSurfaceTextures> {
  try {
    return await loadPlanetImageSurface("Earth");
  } catch {
    return {
      color: makeEarthTexture(),
      height: makeEarthBumpTexture(),
      clouds: makeCloudTexture(),
    };
  }
}

export async function makeSolarSurfaceTexture(seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2d context unavailable");
  const image = context.createImageData(WIDTH, HEIGHT);
  const deep = readTokenColor("planet-rust");
  const mid = readTokenColor("gold");
  const hot = readTokenColor("planet-cream");

  for (let y = 0; y < HEIGHT; y += 1) {
    const v = y / HEIGHT;
    for (let x = 0; x < WIDTH; x += 1) {
      const u = x / WIDTH;
      const convection = fractalNoise(u, v, seed, 5);
      const granules = periodicNoise(u, v, 72, seed ^ 0x6d2b79f5);
      const filaments = periodicNoise(u, v, 19, seed ^ 0x1b873593);
      const activity = THREE.MathUtils.clamp(
        convection * 0.58 + granules * 0.27 + filaments * 0.15,
        0,
        1,
      );
      const surfaceColor = mix(
        mix(deep, mid, smoothstep(0.28, 0.7, activity)),
        hot,
        smoothstep(0.68, 0.9, activity) * 0.84,
      );
      const index = (y * WIDTH + x) * 4;
      image.data[index] = surfaceColor[0];
      image.data[index + 1] = surfaceColor[1];
      image.data[index + 2] = surfaceColor[2];
      image.data[index + 3] = 255;
    }
    if (y > 0 && y % 16 === 0) await yieldToBrowser();
  }

  context.putImageData(image, 0, 0);
  const random = createSeededRandom(seed ^ 0x74d2f831);
  for (let index = 0; index < 26; index += 1) {
    const x = random() * WIDTH;
    const y = random() * HEIGHT;
    const radius = 4 + random() * 24;
    const flare = context.createRadialGradient(x, y, 0, x, y, radius);
    flare.addColorStop(0, rgba(hot, 0.42));
    flare.addColorStop(0.42, rgba(mid, 0.24));
    flare.addColorStop(1, rgba(deep, 0));
    context.fillStyle = flare;
    context.beginPath();
    context.ellipse(x, y, radius, radius * (0.25 + random() * 0.3), random(), 0, Math.PI * 2);
    context.fill();
  }

  return makeCanvasTexture(canvas);
}

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
  width = WIDTH,
  height = HEIGHT,
) {
  const scale = width / WIDTH;
  context.save();
  for (let index = 0; index < count; index += 1) {
    const x = random() * width;
    const y = 22 * scale + random() * (height - 44 * scale);
    const radius = (2 + random() * (index < 8 ? 15 : 8)) * scale;
    const offsets = [x < radius ? width : 0, x > width - radius ? -width : 0];
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

function stampGreatStorm(
  context: CanvasRenderingContext2D,
  color: RGB,
  seed: number,
  width = WIDTH,
  height = HEIGHT,
) {
  const scale = width / WIDTH;
  const stormX = width * 0.34;
  const stormY = height * 0.62;
  const random = createSeededRandom(seed);
  context.save();
  context.translate(stormX, stormY);
  context.rotate(-0.12);
  context.beginPath();
  context.ellipse(0, 0, 44 * scale, 19 * scale, 0, 0, Math.PI * 2);
  context.clip();
  const core = mix(color, [70, 40, 34], 0.46);
  const storm = context.createRadialGradient(-8 * scale, -3 * scale, 2 * scale, 0, 0, 45 * scale);
  storm.addColorStop(0, rgba(core, 0.76));
  storm.addColorStop(0.48, rgba(color, 0.74));
  storm.addColorStop(0.82, rgba(mix(color, [232, 214, 184], 0.34), 0.72));
  storm.addColorStop(1, rgba(color, 0.12));
  context.fillStyle = storm;
  context.beginPath();
  context.ellipse(0, 0, 45 * scale, 20 * scale, 0, 0, Math.PI * 2);
  context.fill();

  for (let ribbon = 0; ribbon < 9; ribbon += 1) {
    const radiusX = (13 + random() * 22) * scale;
    const radiusY = (4 + random() * 8) * scale;
    const start = random() * Math.PI * 2;
    context.beginPath();
    context.ellipse(
      (random() - 0.5) * 7 * scale,
      (random() - 0.5) * 4 * scale,
      radiusX,
      radiusY,
      (random() - 0.5) * 0.32,
      start,
      start + Math.PI * (0.65 + random() * 0.68),
    );
    context.strokeStyle = rgba(
      ribbon % 2 === 0 ? mix(color, [250, 228, 196], 0.3) : core,
      0.14 + random() * 0.2,
    );
    context.lineWidth = (0.8 + random() * 1.5) * scale;
    context.stroke();
  }

  context.restore();
}

export async function makePlanetSurfaceTextures(
  style: PlanetSurfaceStyle,
  seed: number,
  palette: [SpaceColorToken, SpaceColorToken, SpaceColorToken],
  size: { width: number; height: number } = { width: WIDTH, height: HEIGHT },
): Promise<PlanetSurfaceTextures> {
  const { width, height } = size;
  const colors = palette.map(readTokenColor) as [RGB, RGB, RGB];
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorContext = colorCanvas.getContext("2d");
  if (!colorContext) throw new Error("2d context unavailable");
  const colorImage = colorContext.createImageData(width, height);

  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = width;
  heightCanvas.height = height;
  const heightContext = heightCanvas.getContext("2d");
  if (!heightContext) throw new Error("2d context unavailable");
  const heightImage = heightContext.createImageData(width, height);

  const cloudCanvas = style === "rocky" ? null : document.createElement("canvas");
  if (cloudCanvas) {
    cloudCanvas.width = width;
    cloudCanvas.height = height;
  }
  const cloudContext = cloudCanvas?.getContext("2d") ?? null;
  if (cloudCanvas && !cloudContext) throw new Error("2d context unavailable");
  const cloudImage = cloudContext?.createImageData(width, height) ?? null;

  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    const latitude = (v - 0.5) * 2;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
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

      const index = (y * width + x) * 4;
      colorImage.data[index] = surfaceColor[0];
      colorImage.data[index + 1] = surfaceColor[1];
      colorImage.data[index + 2] = surfaceColor[2];
      colorImage.data[index + 3] = 255;
      const height = Math.round(elevation * 255);
      heightImage.data[index] = height;
      heightImage.data[index + 1] = height;
      heightImage.data[index + 2] = height;
      heightImage.data[index + 3] = 255;
      if (cloudImage) {
        cloudImage.data[index] = 245;
        cloudImage.data[index + 1] = 239;
        cloudImage.data[index + 2] = 224;
        cloudImage.data[index + 3] = Math.round(cloud * 210);
      }
    }
    if (y > 0 && y % 16 === 0) await yieldToBrowser();
  }

  colorContext.putImageData(colorImage, 0, 0);
  heightContext.putImageData(heightImage, 0, 0);
  if (cloudContext && cloudImage) cloudContext.putImageData(cloudImage, 0, 0);

  if (style === "rocky") {
    const random = createSeededRandom(seed ^ 0x4f1bbcdc);
    stampCraters(colorContext, random, colors[0], colors[2], seed === 1101 ? 46 : 26, width, height);
    stampCraters(heightContext, createSeededRandom(seed ^ 0x4f1bbcdc), [36, 36, 36], [224, 224, 224], seed === 1101 ? 46 : 26, width, height);
  }
  if (style === "banded" || style === "stormy") {
    stampGreatStorm(colorContext, colors[2], seed ^ 0x7f4a7c15, width, height);
  }

  const color = makeCanvasTexture(colorCanvas);
  const heightTexture = makeCanvasTexture(heightCanvas, false);
  const clouds = cloudCanvas ? makeCanvasTexture(cloudCanvas) : null;

  return { color, height: heightTexture, clouds };
}
