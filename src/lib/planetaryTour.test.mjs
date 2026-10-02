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
  "Sun", "Mercury", "Venus", "Earth", "Mars",
  "Jupiter", "Saturn", "Uranus", "Neptune",
];
const DWARFS = ["Ceres", "Pluto", "Haumea", "Makemake", "Eris"];
const ASPECTS = [470 / 640, 1366 / 768];

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
  const projected = worldOf(name).project(camera);
  return {
    x: (projected.x + 1) / 2,
    y: (1 - projected.y) / 2,
    ndcX: projected.x,
    ndcY: projected.y,
    behind: projected.z > 1,
  };
}

test("initial state is a wide shot showing the whole diagonal composition", () => {
  for (const aspect of ASPECTS) {
    const screens = FOCUS_ORDER.map((name) => project(name, 0, aspect));
    for (const [index, name] of FOCUS_ORDER.entries()) {
      const screen = screens[index];
      assert.equal(screen.behind, false, `${name} is in front at aspect ${aspect}`);
      assert.ok(
        Math.abs(screen.ndcX) <= 1 && Math.abs(screen.ndcY) <= 1,
        `${name} is inside the initial frame at aspect ${aspect}: ${JSON.stringify(screen)}`,
      );
    }
    const sun = screens[0];
    const neptune = screens[screens.length - 1];
    assert.ok(sun.x < 0.5 && sun.y > 0.5, `Sun sits bottom-left: ${JSON.stringify(sun)}`);
    assert.ok(
      neptune.x > 0.5 && neptune.y < 0.5,
      `Neptune sits top-right: ${JSON.stringify(neptune)}`,
    );
    for (let index = 0; index < screens.length - 1; index += 1) {
      assert.ok(
        screens[index + 1].x > screens[index].x,
        `diagonal x order at ${FOCUS_ORDER[index + 1]}: ${screens[index + 1].x} > ${screens[index].x}`,
      );
      assert.ok(
        screens[index + 1].y < screens[index].y,
        `diagonal y order at ${FOCUS_ORDER[index + 1]}: ${screens[index + 1].y} < ${screens[index].y}`,
      );
    }
    const spanX = neptune.x - sun.x;
    const spanY = sun.y - neptune.y;
    assert.ok(spanX > 0.3 && spanY > 0.3, `true diagonal span, not horizontal: ${spanX}, ${spanY}`);
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
      const screen = project(name, (end * (index + 1)) / 9, aspect);
      const distance = Math.hypot(screen.x - 0.5, screen.y - 0.5);
      assert.ok(distance < 0.06, `${name} is centered at aspect ${aspect}: ${JSON.stringify(screen)}`);
    });
  }
});

test("travel keeps the passed planet bottom-left and the next planet top-right", () => {
  const end = cameraPath.CAMERA_SCROLL_STOPS[5];
  for (const aspect of ASPECTS) {
    const diveSun = project(FOCUS_ORDER[0], end * 0.5 / 9, aspect);
    const diveMercury = project(FOCUS_ORDER[1], end * 0.5 / 9, aspect);
    assert.ok(
      diveSun.x < 0.5 && diveSun.y > 0.5,
      `Sun drifts bottom-left on the opening dive: ${JSON.stringify(diveSun)}`,
    );
    for (const screen of [diveSun, diveMercury]) {
      assert.ok(
        Math.abs(screen.ndcX) <= 1 && Math.abs(screen.ndcY) <= 1,
        `opening dive keeps bodies in frame: ${JSON.stringify(screen)}`,
      );
    }
    for (let index = 1; index < FOCUS_ORDER.length; index += 1) {
      const progress = (end * (index + 0.5)) / 9;
      const outgoing = project(FOCUS_ORDER[index - 1], progress, aspect);
      const incoming = project(FOCUS_ORDER[index], progress, aspect);
      assert.ok(
        outgoing.x < 0.5 && outgoing.y > 0.5,
        `${FOCUS_ORDER[index]} drifts bottom-left: ${JSON.stringify(outgoing)}`,
      );
      assert.ok(
        incoming.x > 0.5 && incoming.y < 0.5,
        `${FOCUS_ORDER[index + 1]} waits top-right: ${JSON.stringify(incoming)}`,
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
  for (let index = 0; index < FOCUS_ORDER.length - 1; index += 1) {
    const incoming = worldOf(FOCUS_ORDER[index + 1]);
    const mid = pose((end * (index + 0.5)) / 9);
    const arrival = pose((end * (index + 1)) / 9);
    assert.ok(
      arrival.position.distanceTo(incoming) < mid.position.distanceTo(incoming),
      `${FOCUS_ORDER[index + 1]} draws nearer through its leg`,
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
  assert.deepEqual(tour.getPlanetaryTourReadout(), { body: "Sun", index: 0 });
  tour.updatePlanetaryTourReadout(end);
  assert.deepEqual(tour.getPlanetaryTourReadout(), { body: "Neptune", index: 8 });
  tour.updatePlanetaryTourReadout(end + 0.01);
  assert.equal(tour.getPlanetaryTourReadout(), null);
});
