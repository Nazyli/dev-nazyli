"use client";

import { useSyncExternalStore } from "react";
import {
  getAmbientMotionPaused,
  subscribeToAmbientMotionPaused,
} from "@/lib/universeState";

export function useAmbientMotionPaused() {
  return useSyncExternalStore(
    subscribeToAmbientMotionPaused,
    getAmbientMotionPaused,
    () => false,
  );
}
