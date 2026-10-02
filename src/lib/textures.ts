import * as THREE from "three";

/**
 * Procedural placeholder textures.
 *
 * To swap in a real planetary texture, set the URL constants below (e.g.
 * "/textures/earth.jpg") - the renderers already load through these switches.
 * A null URL falls back to the generated canvas texture.
 */
export const EARTH_TEXTURE_URL: string | null = null;
export const EARTH_CLOUD_URL: string | null = null;
export const PLANET_TEXTURE_URL: string | null = null;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const grad = (h: number, x: number, y: number) => {
    switch (h & 3) {
      case 0:
        return x + y;
      case 1:
        return -x + y;
      case 2:
        return x - y;
      default:
        return -x - y;
    }
  };

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const u = fade(fx);
    const v = fade(fy);
    const aa = perm[perm[X] + Y];
    const ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y];
    const bb = perm[perm[X + 1] + Y + 1];
    return (
      lerp(
        lerp(grad(aa, fx, fy), grad(ba, fx - 1, fy), u),
        lerp(grad(ab, fx, fy - 1), grad(bb, fx - 1, fy - 1), u),
        v,
      ) *
        0.5 +
      0.5
    );
  };
}

function fbm(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves: number,
) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function finalize(texture: THREE.CanvasTexture): THREE.CanvasTexture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeEarthTexture(): THREE.CanvasTexture {
  const W = 768;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const noise = makeNoise(1337);

  for (let y = 0; y < H; y++) {
    const lat = Math.PI * (y / H - 0.5);
    const ice = clamp((Math.abs(lat) - 1.05) / 0.35, 0, 1);
    for (let x = 0; x < W; x++) {
      const nx = x / W;
      const ny = y / H;
      const cont = fbm(noise, nx * 6 + 100, ny * 6 + 100, 5);
      const ridge = fbm(noise, nx * 9 + 17, ny * 9 + 17, 4);
      const i = (y * W + x) * 4;
      let r: number;
      let g: number;
      let b: number;
      if (cont > 0.56) {
        r = lerp(0x2c, 0x6b, ridge);
        g = lerp(0x3d, 0x5f, ridge);
        b = lerp(0x2a, 0x47, ridge);
      } else {
        const shallow = clamp((0.56 - cont) * 8, 0, 1);
        r = lerp(0x0e, 0x16, shallow);
        g = lerp(0x22, 0x3a, shallow);
        b = lerp(0x38, 0x5c, shallow);
      }
      if (ice > 0) {
        r = lerp(r, 0xcd, ice);
        g = lerp(g, 0xd8, ice);
        b = lerp(b, 0xde, ice);
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

function makeEarthBumpTexture(): THREE.CanvasTexture {
  const W = 256;
  const H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const noise = makeNoise(7331);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = x / W;
      const ny = y / H;
      const v = fbm(noise, nx * 8 + 3, ny * 8 + 3, 4);
      const i = (y * W + x) * 4;
      data[i] = v * 255;
      data[i + 1] = v * 255;
      data[i + 2] = v * 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function makeCloudTexture(): THREE.CanvasTexture {
  const W = 768;
  const H = 384;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const noise = makeNoise(4242);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const nx = x / W;
      const ny = y / H;
      const c = fbm(noise, nx * 10 + 200, ny * 10 + 200, 5);
      const i = (y * W + x) * 4;
      const a = c > 0.56 ? clamp((c - 0.56) * 4, 0, 1) : 0;
      data[i] = 245;
      data[i + 1] = 239;
      data[i + 2] = 224;
      data[i + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

function gauss(t: number, c: number, w: number) {
  return Math.exp(-Math.pow((t - c) / w, 2));
}

function makePlanetTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const noise = makeNoise(90210);
  const detail = makeNoise(31337);

  for (let y = 0; y < H; y++) {
    const ny = y / H;
    const pole = clamp((Math.abs(ny - 0.5) * 2 - 0.5) * 1.6, 0, 1);
    for (let x = 0; x < W; x++) {
      const nx = x / W;
      const turb = fbm(noise, nx * 2.5 + 7, ny * 2.5 + 11, 5) - 0.5;
      const lat = ny + turb * 0.09;
      const bands =
        0.5 +
        0.5 * Math.sin(lat * Math.PI * 5 + turb * 1.4) +
        0.16 * Math.sin(lat * Math.PI * 12 + turb * 3.2) +
        0.06 * Math.sin(lat * Math.PI * 26 + turb * 6);
      const b = clamp(bands, 0, 1);
      const tex = fbm(detail, nx * 36 + 3, ny * 36 + 5, 4) - 0.5;
      const i = (y * W + x) * 4;
      let r = lerp(150, 210, b) + tex * 22;
      let g = lerp(110, 168, b) + tex * 18;
      let bl = lerp(72, 128, b) + tex * 14;
      r += (1 - b) * 12;
      r *= 1 - pole * 0.22;
      g *= 1 - pole * 0.2;
      bl *= 1 - pole * 0.12;
      data[i] = clamp(r, 0, 255);
      data[i + 1] = clamp(g, 0, 255);
      data[i + 2] = clamp(bl, 0, 255);
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

function makeNebulaTexture(seed: number): THREE.CanvasTexture {
  const W = 512;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const noise = makeNoise(seed);
  const detail = makeNoise(seed ^ 0x9e3779b9);

  for (let y = 0; y < H; y++) {
    const fy = y / H;
    for (let x = 0; x < W; x++) {
      const fx = x / W;
      const dx = fx - 0.5;
      const dy = fy - 0.5;
      const r2 = dx * dx + dy * dy;
      const falloff = Math.exp(-r2 * 3.1);
      const edgeDistance = Math.min(fx, 1 - fx, fy, 1 - fy);
      const edgeProgress = clamp(edgeDistance / 0.24, 0, 1);
      const edgeFade = edgeProgress * edgeProgress * (3 - 2 * edgeProgress);
      const v = fbm(noise, fx * 2.6 + 40, fy * 3.2 + 40, 5);
      const density = clamp((v - 0.42) * 6, 0, 1) * falloff * edgeFade;
      const lum = 0.6 + 0.4 * fbm(detail, fx * 6 + 7, fy * 6 + 9, 4);
      const i = (y * W + x) * 4;
      const c = clamp(245 * lum, 0, 255);
      data[i] = c;
      data[i + 1] = c;
      data[i + 2] = clamp(224 * lum, 0, 255);
      data[i + 3] = clamp(density * 255, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

function makeDustLaneTexture(seed: number): THREE.CanvasTexture {
  const W = 512;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(W, H);
  const data = img.data;
  const noise = makeNoise(seed);

  for (let y = 0; y < H; y++) {
    const fy = y / H;
    for (let x = 0; x < W; x++) {
      const fx = x / W;
      const r2 = (fx - 0.5) * (fx - 0.5) + (fy - 0.5) * (fy - 0.5);
      const rim = clamp(1 - r2 * 4.6, 0, 1);
      const v = fbm(noise, fx * 2.6 + 3, fy * 2.6 + 3, 5);
      const lane = clamp((v - 0.6) * 9, 0, 1);
      const bright = clamp(0.62 - lane * 0.5, 0, 1);
      const i = (y * W + x) * 4;
      const c = clamp(bright * 255, 0, 255);
      data[i] = c;
      data[i + 1] = c;
      data[i + 2] = clamp(bright * 255 + 8, 0, 255);
      data[i + 3] = clamp(lane * 255 * rim, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

function makeRingTexture(): THREE.CanvasTexture {
  const SIZE = 1024;
  const R_INNER = 1.32;
  const R_OUTER = 2.35;
  const rInner = R_INNER / R_OUTER;
  const band = 1 - rInner;
  const PROFILE_N = 2048;
  const profile = new Float32Array(PROFILE_N);
  for (let i = 0; i < PROFILE_N; i++) {
    const t = i / (PROFILE_N - 1);
    const p =
      0.9 * gauss(t, 0.55, 0.22) +
      0.6 * gauss(t, 0.86, 0.09) +
      0.22 * gauss(t, 0.28, 0.08);
    const cassini = 1 - 0.9 * gauss(t, 0.68, 0.012);
    const encke = 1 - 0.5 * gauss(t, 0.935, 0.007);
    const grooves =
      0.5 + 0.5 * Math.sin(t * Math.PI * 61 + 2.4 * Math.sin(t * Math.PI * 11));
    profile[i] = Math.max(0, p) * cassini * encke * (0.32 + 0.68 * grooves);
  }

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(SIZE, SIZE);
  const data = img.data;
  const half = SIZE / 2;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x - half) / half;
      const dy = (y - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      let alpha = 0;
      if (r > rInner && r < 1) {
        const t = (r - rInner) / band;
        const edge = Math.min(1, (r - rInner) * half, (1 - r) * half);
        alpha = profile[Math.round(t * (PROFILE_N - 1))] * edge;
      }
      const i = (y * SIZE + x) * 4;
      data[i] = 203;
      data[i + 1] = 178;
      data[i + 2] = 138;
      data[i + 3] = Math.round(clamp(alpha, 0, 1) * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

function makeAccretionDiskTexture(size = 768): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const noise = makeNoise(5150);
  const detail = makeNoise(6262);
  const half = size / 2;
  const INNER = 1.4;
  const OUTER = 6.0;
  const innerFrac = INNER / OUTER;
  const thermalPalette = [
    [206, 229, 255],
    [255, 248, 225],
    [255, 192, 112],
    [207, 123, 132],
    [78, 111, 178],
  ];

  const sstep = (a: number, b: number, x: number) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  for (let y = 0; y < size; y++) {
    const dy = (y - half) / half;
    for (let x = 0; x < size; x++) {
      const dx = (x - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      const i = (y * size + x) * 4;
      if (r < innerFrac * 0.8 || r > 1) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        continue;
      }
      const theta = Math.atan2(dy, dx);

      const swirl = 0.18 - 1.15 * r;
      const ca = Math.cos(swirl);
      const sa = Math.sin(swirl);
      const sx = dx * ca - dy * sa;
      const sy = dx * sa + dy * ca;

      const n = fbm(noise, sx * 2.4 + 7, sy * 2.4 + 9, 5);
      const d = fbm(detail, sx * 8 + 3, sy * 8 + 5, 3);

      const radial = clamp(((r - innerFrac) / (1 - innerFrac)) * 3.99, 0, 3.99);
      const paletteIndex = Math.floor(radial);
      const paletteBlend = radial - paletteIndex;
      const hot = thermalPalette[paletteIndex];
      const cool = thermalPalette[paletteIndex + 1];
      const innerFade = sstep(innerFrac, innerFrac + 0.045, r);
      const outerFade = 1 - sstep(0.76, 1, r);
      const doppler = 0.38 + 0.82 * ((Math.sin(theta) + 1) * 0.5);
      const turbulence = 0.58 + 0.42 * Math.sin(n * 6.283 + r * 13);
      const density = 0.24 + 0.76 * d * d;
      const flare = Math.pow(Math.max(n - 0.64, 0) * 2.8, 2);
      const hotspot = Math.pow(Math.max(0, Math.cos(theta - 0.55)), 5);
      const brightness =
        doppler * turbulence * (0.56 + density * 0.44) * (1 + hotspot * 0.48);
      const hotR = lerp(lerp(hot[0], cool[0], paletteBlend), 255, hotspot * 0.38);
      const hotG = lerp(lerp(hot[1], cool[1], paletteBlend), 185, hotspot * 0.22);
      const hotB = lerp(lerp(hot[2], cool[2], paletteBlend), 106, hotspot * 0.12);

      data[i] = clamp(
        hotR * brightness + flare * 84,
        0,
        255,
      );
      data[i + 1] = clamp(
        hotG * brightness + flare * 72,
        0,
        255,
      );
      data[i + 2] = clamp(
        hotB * brightness + flare * 52,
        0,
        255,
      );
      data[i + 3] = clamp(innerFade * outerFade * density * 255, 0, 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

function makePhotonRingTexture(size = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const noise = makeNoise(9411);
  const filaments = makeNoise(9473);
  const half = size / 2;
  const palette = [
    [180, 218, 255],
    [255, 249, 232],
    [255, 198, 121],
    [106, 125, 205],
  ];

  const sstep = (a: number, b: number, x: number) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };

  for (let y = 0; y < size; y++) {
    const dy = (y - half) / half;
    for (let x = 0; x < size; x++) {
      const dx = (x - half) / half;
      const r = Math.sqrt(dx * dx + dy * dy);
      const i = (y * size + x) * 4;
      if (r < 0.59 || r > 1) continue;

      const theta = Math.atan2(dy, dx);
      const n = fbm(noise, dx * 7 + 13, dy * 7 + 19, 5);
      const f = fbm(filaments, dx * 15 + 5, dy * 15 + 11, 3);
      const radial = clamp((r - 0.59) / 0.41, 0, 0.999);
      const palettePosition = radial * (palette.length - 1);
      const paletteIndex = Math.floor(palettePosition);
      const paletteBlend = palettePosition - paletteIndex;
      const warpedRim =
        0.69 +
        0.026 * Math.sin(theta * 3 + 1.4) +
        0.018 * Math.sin(theta * 7 + n * 8) +
        0.008 * Math.sin(theta * 13 + f * 10);
      const innerRim = Math.exp(-Math.pow((r - warpedRim) / 0.042, 2));
      const outerFade = 1 - sstep(0.9, 1, r);
      const doppler = 0.22 + 1.12 * ((Math.sin(theta) + 1) * 0.5);
      const clumps = 0.06 + 1.12 * Math.pow(f, 1.8);
      const arc = Math.max(0, Math.sin(theta * 2.3 + n * 3.6 + f * 1.8));
      const caustic = Math.pow(arc, 8);
      const hotspot = Math.pow(Math.max(0, Math.cos(theta - 0.55)), 6);
      const turbulentGap = sstep(0.38, 0.82, f) * innerRim * 0.52;
      const brightness =
        doppler * clumps * (0.08 + innerRim * 0.92 + caustic * 0.9) *
        (1 + hotspot * 0.72);
      const alpha = clamp(
        outerFade *
          (0.018 + innerRim * (0.23 + caustic * 0.92)) *
          (0.24 + n * 0.76) *
          (0.28 + clumps * 0.72) *
          (1 - turbulentGap),
        0,
        1,
      );
      const hot = palette[paletteIndex];
      const cool = palette[paletteIndex + 1];

      data[i] = clamp(
        lerp(lerp(hot[0], cool[0], paletteBlend), 255, hotspot * 0.3) * brightness,
        0,
        255,
      );
      data[i + 1] = clamp(
        lerp(lerp(hot[1], cool[1], paletteBlend), 175, hotspot * 0.16) * brightness,
        0,
        255,
      );
      data[i + 2] = clamp(
        lerp(lerp(hot[2], cool[2], paletteBlend), 105, hotspot * 0.08) * brightness,
        0,
        255,
      );
      data[i + 3] = alpha * 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return finalize(new THREE.CanvasTexture(canvas));
}

export {
  makeEarthTexture,
  makeEarthBumpTexture,
  makeCloudTexture,
  makePlanetTexture,
  makeRingTexture,
  makeNebulaTexture,
  makeDustLaneTexture,
  makeAccretionDiskTexture,
  makePhotonRingTexture,
};
