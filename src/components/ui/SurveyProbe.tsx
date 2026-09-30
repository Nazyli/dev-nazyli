"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const PROBE_TRAIL = 16;
const COMET_TRAIL = 14;
const CENTER_DAMP = 0.1;
const ORBIT_R1 = 20;
const ORBIT_R2 = 38;
const SPIN1 = 0.55;
const SPIN2 = -0.32;
const EXPLOSION_PARTICLES = 90;
const EXPLOSION_DURATION = 1.6;
const RING_SPEED = 110;

type Pt = { x: number; y: number };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
};

type Explosion = {
  x: number;
  y: number;
  age: number;
  particles: Particle[];
};

export function SurveyProbe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (reducedMotion) {
      canvas.style.opacity = "0";
      return;
    }
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let scheduleFrame = () => {};
    let shown = false;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let ox = tx;
    let oy = ty;
    let a1 = 0;
    let a2 = Math.PI;
    let px = ox + ORBIT_R1;
    let py = oy;
    let cx = ox - ORBIT_R2;
    let cy = oy;
    let last = 0;
    let explosions: Explosion[] = [];
    const probePts: Pt[] = [];
    const cometPts: Pt[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const onMove = (event: PointerEvent) => {
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
      tx = event.clientX;
      ty = event.clientY;
      scheduleFrame();
    };

    const onDown = (event: PointerEvent) => {
      if (!shown) {
        shown = true;
        canvas.style.opacity = "1";
      }
      const particles: Particle[] = [];
      for (let i = 0; i < EXPLOSION_PARTICLES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 190;
        particles.push({
          x: event.clientX,
          y: event.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.9,
          size: 0.6 + Math.random() * 1.9,
        });
      }
      explosions.push({ x: event.clientX, y: event.clientY, age: 0, particles });
      scheduleFrame();
    };

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
      last = now;

      ox += (tx - ox) * CENTER_DAMP;
      oy += (ty - oy) * CENTER_DAMP;
      a1 += SPIN1 * dt;
      a2 += SPIN2 * dt;

      px = ox + Math.cos(a1) * ORBIT_R1;
      py = oy + Math.sin(a1) * ORBIT_R1;
      cx = ox + Math.cos(a2) * ORBIT_R2;
      cy = oy + Math.sin(a2) * ORBIT_R2;

      probePts.push({ x: px, y: py });
      if (probePts.length > PROBE_TRAIL) probePts.shift();
      cometPts.push({ x: cx, y: cy });
      if (cometPts.length > COMET_TRAIL) cometPts.shift();

      explosions.forEach((ex) => {
        ex.age += dt;
        ex.particles.forEach((p) => {
          p.life += dt;
          const drag = Math.pow(0.35, dt);
          p.vx *= drag;
          p.vy *= drag;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        });
      });
      explosions = explosions.filter((ex) => ex.age < EXPLOSION_DURATION);

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (probePts.length > 1) {
        ctx.beginPath();
        probePts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = "rgba(102,217,232,0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(102,217,232,0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(px, py, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(102,217,232,0.9)";
      ctx.fill();

      const n = cometPts.length;
      cometPts.forEach((p, i) => {
        const t = i / n;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5 * t + 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(217,179,106,${(t * 0.4).toFixed(3)})`;
        ctx.fill();
      });
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(245,239,224,0.95)";
      ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      explosions.forEach((ex) => {
        const t = ex.age / EXPLOSION_DURATION;

        const ringR = 14 + ex.age * RING_SPEED;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245,239,224,${(0.55 * (1 - t)).toFixed(3)})`;
        ctx.lineWidth = 1.6 * (1 - t) + 0.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ringR * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(217,179,106,${(0.4 * (1 - t)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        if (t < 0.3) {
          const f = 1 - t / 0.3;
          ctx.beginPath();
          ctx.arc(ex.x, ex.y, 8 + ex.age * 60, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(245,239,224,${(0.55 * f).toFixed(3)})`;
          ctx.fill();
        }

        ex.particles.forEach((p) => {
          const lt = p.life / p.maxLife;
          if (lt >= 1) return;
          const r = Math.round(245 - 50 * lt);
          const g = Math.round(239 - 70 * lt);
          const b = Math.round(224 - 130 * lt);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (1 - lt * 0.7), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${((1 - lt) * 0.9).toFixed(3)})`;
          ctx.fill();
        });
      });
      ctx.restore();
    };

    scheduleFrame = () => {
      if (rafId === 0 && document.visibilityState === "visible") {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(rafId);
        rafId = 0;
        last = 0;
        return;
      }

      if (shown) scheduleFrame();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[55] opacity-0 transition-opacity duration-500 motion-reduce:transition-none"
    />
  );
}
