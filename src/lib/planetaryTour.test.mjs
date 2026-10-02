import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import * as THREE from "three";

const require = createRequire(import.meta.url);
const projectRoot = process.cwd();
const cache = new Map();

function loadModule(file) {
  const resolved = path.resolve(projectRoot, file);
  if (cache.has(resolved)) return cache.get(resolved).exports;

  const loaded = { exports: {} };
  cache.set(resolved, loaded);
  const source = readFileSync(resolved, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = (specifier) =>
    specifier.startsWith("@/")
      ? loadModule(path.join("src", `${specifier.slice(2)}.ts`))
      : require(specifier);
  new Function("require", "module", "exports", compiled)(
    localRequire,
    loaded,
    loaded.exports,
  );
  return loaded.exports;
}

const tour = loadModule("src/lib/planetaryTour.ts");
const cameraPath = loadModule("src/lib/cameraPath.ts");

const FOCUS_ORDER = [
  "Sun", "Mercury", "Venus", "Earth", "Mars", "Ceres",
  "Jupiter", "Saturn", "Uranus", "Neptune",
  "Pluto", "Haumea", "Makemake", "Eris",
];
const DWARFS = ["Ceres", "Pluto", "Haumea", "Makemake", "Eris"];
const DWARF_RADII = { Ceres: 1.2, Pluto: 1.25, Haumea: 1.32, Makemake: 1.3, Eris: 1.45 };
const RADII = {
  Sun: 3.2, Mercury: 1.1, Venus: 1.55, Earth: 1.82, Mars: 1.25, Ceres: 1.2,
  Jupiter: 3.1, Saturn: 2.72, Uranus: 2.05, Neptune: 2.35,
  Pluto: 1.25, Haumea: 1.15, Makemake: 1.2, Eris: 1.25,
};
const ASPECTS = [470 / 640, 1366 / 768];
const LEGS = FOCUS_ORDER.length - 1;

function pose(progress, aspect = 1366 / 768) {
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  assert.equal(tour.getPlanetaryTourPose(progress, position, target, aspect), true);
  return { position, target };
}

function worldOf(name) {
  return name === "Sun"
    ? new THREE.Vector3(0, 0, -18)
    : tour.getPlanetaryBodyPosition(name, new THREE.Vector3()).add(
        new THREE.Vector3(0, 0, -18),
      );
}

function project(name, progress, aspect) {
  const { position, target } = pose(progress, aspect);
  const camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 500);
  camera.position.copy(position);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const world = worldOf(name);
  const distance = position.distanceTo(world);
  const projected = world.project(camera);
  return {
    x: (projected.x + 1) / 2,
    y: (1 - projected.y) / 2,
    ndcX: projected.x,
    ndcY: projected.y,
    behind: projected.z > 1,
    distance,
  };
}

test("initial state centers the Sun with the queue receding up-right", () => {
  for (const aspect of ASPECTS) {
    const sun = project("Sun", 0, aspect);
    assert.ok(
      Math.abs(sun.x - 0.5) < 0.03 && Math.abs(sun.y - 0.5) < 0.03,
      `Sun is centered at aspect ${aspect}: ${JSON.stringify(sun)}`,
    );
    const screens = FOCUS_ORDER.map((name) => project(name, 0, aspect));
    for (const [index, name] of FOCUS_ORDER.entries()) {
      const screen = screens[index];
      assert.equal(screen.behind, false, `${name} is in front at aspect ${aspect}`);
      assert.ok(
        Math.abs(screen.ndcX) <= 1 && Math.abs(screen.ndcY) <= 1,
        `${name} is visible initially at aspect ${aspect}: ${JSON.stringify(screen)}`,
      );
    }
    const regress = (values) => {
      const n = values.length;
      const meanX = (n - 1) / 2;
      const meanY = values.reduce((sum, value) => sum + value, 0) / n;
      let num = 0;
      let den = 0;
      for (let index = 0; index < n; index += 1) {
        num += (index - meanX) * (values[index] - meanY);
        den += (index - meanX) * (index - meanX);
      }
      return num / den;
    };
    const slopeX = regress(screens.map((screen) => screen.x));
    const slopeY = regress(screens.map((screen) => screen.y));
    assert.ok(slopeX > 0.008, `queue trends right at aspect ${aspect}: ${slopeX}`);
    assert.ok(slopeY < -0.008, `queue trends up at aspect ${aspect}: ${slopeY}`);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(55 / 2));
    for (const name of DWARFS) {
      const screen = project(name, 0, aspect);
      assert.equal(screen.behind, false, `${name} is in front at aspect ${aspect}`);
      assert.ok(
        Math.abs(screen.ndcX) <= 1 && Math.abs(screen.ndcY) <= 1,
        `${name} is visible initially at aspect ${aspect}: ${JSON.stringify(screen)}`,
      );
      const apparent = DWARF_RADII[name] / (screen.distance * 2 * tanHalf);
      assert.ok(
        apparent > 0.0115,
        `${name} is large enough to read initially: ${apparent.toFixed(3)}`,
      );
    }
    for (let index = 0; index < screens.length - 1; index += 1) {
      const a = screens[index];
      const b = screens[index + 1];
      const radiusA = RADII[FOCUS_ORDER[index]] / (a.distance * 2 * tanHalf);
      const radiusB = RADII[FOCUS_ORDER[index + 1]] / (b.distance * 2 * tanHalf);
      const separation = Math.hypot((b.x - a.x) * aspect, b.y - a.y);
      assert.ok(
        separation > 0.4 * (radiusA + radiusB),
        `${FOCUS_ORDER[index + 1]} peeks out behind ${FOCUS_ORDER[index]}: sep ${separation.toFixed(3)}`,
      );
    }
  }
});

test("no planet is hidden or appears later during the journey", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  for (const progress of [0, end * 0.25, end * 0.5, end * 0.75, end]) {
    for (const name of [...FOCUS_ORDER, ...DWARFS]) {
      assert.equal(
        tour.getPlanetaryBodyVisibility(progress, name),
        1,
        `${name} is visible at progress ${progress}`,
      );
    }
  }
  assert.equal(tour.getPlanetaryBodyVisibility(0, "Unknown"), 0);
});

test("each planet receives a centered focus as the camera travels", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  for (const aspect of ASPECTS) {
    FOCUS_ORDER.forEach((name, index) => {
      const screen = project(name, (end * index) / LEGS, aspect);
      const distance = Math.hypot(screen.x - 0.5, screen.y - 0.5);
      assert.ok(distance < 0.06, `${name} is centered at aspect ${aspect}: ${JSON.stringify(screen)}`);
    });
  }
});

test("travel moves the passed planet bottom-left and the next one top-right", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  for (const aspect of ASPECTS) {
    for (let index = 1; index < FOCUS_ORDER.length; index += 1) {
      const progress = (end * (index - 0.5)) / LEGS;
      const outgoing = project(FOCUS_ORDER[index - 1], progress, aspect);
      const incoming = project(FOCUS_ORDER[index], progress, aspect);
      assert.ok(
        outgoing.x < 0.5 && outgoing.y > 0.5,
        `${FOCUS_ORDER[index - 1]} drifts bottom-left: ${JSON.stringify(outgoing)}`,
      );
      assert.ok(
        incoming.x > 0.5 && incoming.y < 0.5,
        `${FOCUS_ORDER[index]} waits top-right: ${JSON.stringify(incoming)}`,
      );
      for (const screen of [outgoing, incoming]) {
        assert.ok(
          Math.abs(screen.ndcX) <= 1 && Math.abs(screen.ndcY) <= 1,
          `mid-travel bodies stay in frame: ${JSON.stringify(screen)}`,
        );
      }
    }
  }
});

test("the approached planet grows nearer through its own leg", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  for (let index = 1; index < FOCUS_ORDER.length; index += 1) {
    const incoming = worldOf(FOCUS_ORDER[index]);
    const mid = pose((end * (index - 0.5)) / LEGS);
    const arrival = pose((end * index) / LEGS);
    assert.ok(
      arrival.position.distanceTo(incoming) < mid.position.distanceTo(incoming),
      `${FOCUS_ORDER[index]} draws nearer through its leg`,
    );
  }
});

test("the whole journey is one continuous move without resets", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  let previous = pose(0);
  for (let step = 1; step <= 900; step += 1) {
    const current = pose((end * step) / 900);
    assert.ok(
      current.position.distanceTo(previous.position) < 1.5,
      `camera moves continuously at step ${step}`,
    );
    assert.ok(
      current.target.distanceTo(previous.target) < 1.5,
      `target moves continuously at step ${step}`,
    );
    previous = current;
  }
});

test("planets fade only after the journey ends, then Neptune leads into contact", () => {
  const start = cameraPath.CAMERA_SCROLL_STOPS[5];
  const end = cameraPath.CAMERA_SCROLL_STOPS[6];
  assert.ok(tour.getPlanetaryBodyVisibility(start, "Sun") === 1);
  assert.ok(tour.getPlanetaryBodyVisibility(start, "Neptune") === 1);
  const mid = (start + end) / 2;
  const midVisibility = tour.getPlanetaryBodyVisibility(mid, "Neptune");
  assert.ok(midVisibility > 0 && midVisibility < 1, `gradual exit, got ${midVisibility}`);
  assert.equal(tour.getPlanetaryBodyVisibility(end, "Neptune"), 0);

  const transition = pose(mid);
  const contact = pose(end);
  const expected = cameraPath.cameraPath.getPointAt(cameraPath.CAMERA_POSITION_STOPS[6]);
  assert.ok(contact.position.distanceTo(expected) < 0.01);
  assert.ok(transition.position.distanceTo(contact.position) > 0);
});

test("the flyby readout walks the full sequence", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  tour.updatePlanetaryTourReadout(0);
  assert.deepEqual(tour.getPlanetaryTourReadout(), { body: "Sun", index: -1 });
  tour.updatePlanetaryTourReadout(end);
  assert.deepEqual(tour.getPlanetaryTourReadout(), { body: "Eris", index: 12 });
  tour.updatePlanetaryTourReadout((end * 5) / LEGS);
  assert.deepEqual(tour.getPlanetaryTourReadout(), { body: "Ceres", index: 4 });
  tour.updatePlanetaryTourReadout((end * 10) / LEGS);
  assert.deepEqual(tour.getPlanetaryTourReadout(), { body: "Pluto", index: 9 });
  tour.updatePlanetaryTourReadout(end * 0.5);
  const midReadout = tour.getPlanetaryTourReadout();
  assert.ok(midReadout && midReadout.index >= 0 && midReadout.index <= 12);
  tour.updatePlanetaryTourReadout(end + 0.01);
  assert.equal(tour.getPlanetaryTourReadout(), null);
});
