export const universeState = {
  progress: 0,
  mouseX: 0,
  mouseY: 0,
  reducedMotion: false,
  ambientMotionPaused: false,
};

const ambientMotionListeners = new Set<() => void>();

export function getAmbientMotionPaused() {
  return universeState.ambientMotionPaused;
}

export function subscribeToAmbientMotionPaused(listener: () => void) {
  ambientMotionListeners.add(listener);
  return () => ambientMotionListeners.delete(listener);
}

export function setAmbientMotionPaused(paused: boolean) {
  if (universeState.ambientMotionPaused === paused) return;
  universeState.ambientMotionPaused = paused;
  ambientMotionListeners.forEach((listener) => listener());
}
