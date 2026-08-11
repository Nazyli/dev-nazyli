import * as THREE from "three";

/**
 * Procedural placeholder textures.
 *
 * To swap in a real planetary texture, set the URL constants below (e.g.
 * "/textures/earth.jpg") — the renderers already load through these switches.
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
        v
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
  octaves: number
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
  const W = 1024;
  const H = 512;
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
  const W = 512;
  const H = 256;
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
  const W = 1024;
  const H = 512;
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
  const W = 2048;
  const H = 1024;
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

function makeRingTexture(): THREE.CanvasTexture {
  const SIZE = 2048;
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

export {
  makeEarthTexture,
  makeEarthBumpTexture,
  makeCloudTexture,
  makePlanetTexture,
  makeRingTexture,
};
