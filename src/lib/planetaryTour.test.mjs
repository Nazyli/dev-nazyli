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

function pose(progress) {
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  assert.equal(tour.getPlanetaryTourPose(progress, position, target), true);
  return { position, target };
}

test("the Sun begins centered and grows during its own zoom phase", () => {
  const start = pose(0);
  const zoom = pose(cameraPath.CAMERA_SCROLL_STOPS[5] * 0.055);
  assert.ok(Math.abs(start.position.x - start.target.x) < 0.01);
  assert.ok(Math.abs(start.target.x) < 0.01);
  assert.ok(zoom.position.distanceTo(zoom.target) < start.position.distanceTo(start.target));
  assert.ok(zoom.target.distanceTo(start.target) < 0.01);
});

test("each handoff moves the camera diagonally while the next planet settles at center", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  const stage = end / 9;
  const sunZoom = pose(stage * 0.55);
  const pan = pose(stage * 0.78);
  const mercury = pose(stage);
  const mercuryWorld = tour.getPlanetaryBodyPosition("Mercury", new THREE.Vector3());
  mercuryWorld.z -= 18;

  assert.ok(pan.position.x > sunZoom.position.x);
  assert.ok(pan.position.z > sunZoom.position.z);
  assert.ok(pan.target.x > sunZoom.target.x);
  assert.ok(mercury.target.distanceTo(mercuryWorld) < 0.01);
  assert.ok(mercury.position.distanceTo(pan.position) > 0);
});

test("planet handoffs stay continuous and only nearby bodies are visible", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  const stage = end / 9;
  const before = pose(stage - 0.000001);
  const after = pose(stage + 0.000001);
  assert.ok(before.position.distanceTo(after.position) < 0.01);
  assert.ok(before.target.distanceTo(after.target) < 0.01);
  assert.equal(tour.getPlanetaryBodyVisibility(0, "Mercury"), 0);
  assert.equal(tour.getPlanetaryBodyVisibility(0, "Neptune"), 0);
  assert.ok(tour.getPlanetaryBodyVisibility(stage * 0.78, "Mercury") > 0);
  assert.equal(tour.getPlanetaryBodyVisibility(stage, "Mercury"), 1);
});

test("all eight planets receive a centered focus and a closer camera pass", () => {
  const names = [
    "Mercury", "Venus", "Earth", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune",
  ];
  const stage = cameraPath.CAMERA_SCROLL_STOPS[5] / 9;
  names.forEach((name, index) => {
    const focus = pose((index + 1) * stage);
    const zoom = pose((index + 1 + 0.55) * stage);
    const world = tour.getPlanetaryBodyPosition(name, new THREE.Vector3());
    world.z -= 18;
    assert.ok(focus.target.distanceTo(world) < 0.01, `${name} is centered`);
    assert.ok(zoom.position.distanceTo(world) < focus.position.distanceTo(world), `${name} zooms closer`);
  });
});

test("Neptune leads smoothly into the existing contact camera", () => {
  const start = cameraPath.CAMERA_SCROLL_STOPS[5];
  const end = cameraPath.CAMERA_SCROLL_STOPS[6];
  const neptune = pose(start);
  const transition = pose((start + end) / 2);
  const contact = pose(end);
  const expected = cameraPath.cameraPath.getPointAt(cameraPath.CAMERA_POSITION_STOPS[6]);

  assert.ok(transition.position.distanceTo(neptune.position) > 0);
  assert.ok(transition.position.distanceTo(contact.position) > 0);
  assert.ok(contact.position.distanceTo(expected) < 0.01);
});
