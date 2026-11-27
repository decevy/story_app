/** How long Enter (send) or Backspace (clear draft) has to be held. */
export const HOLD_MS = 1500;

export interface HoldTimerOptions {
  durationMs?: number;
  /** Called every animation frame with the progress, from 0 to 1. */
  onProgress?: (progress: number) => void;
  /** Called once when the hold reaches its end. */
  onComplete: () => void;
}

export interface HoldTimer {
  /** Starts (or restarts) a hold. */
  start(): void;
  /** Cancels a running hold. Keeps the `completed` flag, so a later key-up can still read it. */
  stop(): void;
  /** Whether the last hold completed; resets the flag. */
  takeCompleted(): boolean;
}

/** A key-hold timer driven by requestAnimationFrame. */
export function createHoldTimer({
  durationMs = HOLD_MS,
  onProgress,
  onComplete,
}: HoldTimerOptions): HoldTimer {
  let startedAt: number | null = null;
  let frame: number | null = null;
  let completed = false;

  const cancelFrame = () => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  };

  const tick = () => {
    if (startedAt === null) {
      return;
    }
    const progress = Math.min((performance.now() - startedAt) / durationMs, 1);
    onProgress?.(progress);
    if (progress < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }
    frame = null;
    startedAt = null;
    if (!completed) {
      completed = true;
      onComplete();
    }
  };

  return {
    start() {
      cancelFrame();
      completed = false;
      startedAt = performance.now();
      frame = requestAnimationFrame(tick);
    },
    stop() {
      cancelFrame();
      startedAt = null;
    },
    takeCompleted() {
      const wasCompleted = completed;
      completed = false;
      return wasCompleted;
    },
  };
}
