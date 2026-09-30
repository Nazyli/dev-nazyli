"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { useEntrance } from "@/components/providers/EntranceProvider";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

type Streak = {
  angle: number;
  length: number;
  width: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260811);

const STREAKS: Streak[] = Array.from({ length: 56 }, (_, i) => {
  const angle = rand() * 360;
  const length = 70 + rand() * 180;
  const width = rand() > 0.8 ? 2 : 1;
  const duration = 0.6 + rand() * 0.4;
  const delay = (i % 7) * 0.05;
  const opacity = 0.35 + rand() * 0.55;
  const color = rand() > 0.8 ? "var(--color-gold)" : "var(--color-starlight)";
  return { angle, length, width, duration, delay, opacity, color };
});

const READY_MIN = 900;
const READY_MIN_REDUCED = 400;
const TIMEOUT = 2600;
const TIMEOUT_REDUCED = 800;
const FADE_MS = 650;

export function WarpOverlay() {
  const { ready } = useEntrance();
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const startRef = useRef(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionPreference,
    () => false,
  );

  useEffect(() => {
    startRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (leaving) return;

    const timeout = reducedMotion ? TIMEOUT_REDUCED : TIMEOUT;
    const readyMinimum = reducedMotion ? READY_MIN_REDUCED : READY_MIN;
    const deadline =
      startRef.current + Math.min(timeout, ready ? readyMinimum : timeout);
    const timer = window.setTimeout(
      () => setLeaving(true),
      Math.max(0, deadline - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [ready, reducedMotion, leaving]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setGone(true), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  if (gone) return null;

  return (
    <>
      <noscript>
        <style>{`.warp-overlay { display: none; }`}</style>
      </noscript>
      <div
        aria-hidden
        className={`warp-overlay pointer-events-none fixed inset-0 z-40 overflow-hidden transition-opacity duration-500 ${
          leaving ? "is-leaving opacity-0" : "opacity-100"
        }`}
      >
        {STREAKS.map((streak, i) => (
          <span
            key={i}
            className="warp-streak"
            style={{ "--a": `${streak.angle}deg` } as CSSProperties}
          >
            <span
              className="warp-streak-bar"
              style={
                {
                  "--len": `${streak.length}px`,
                  "--w": `${streak.width}px`,
                  "--dur": `${streak.duration}s`,
                  "--delay": `${streak.delay}s`,
                  "--o": streak.opacity,
                  "--c": streak.color,
                } as CSSProperties
              }
            />
          </span>
        ))}
      </div>
    </>
  );
}
