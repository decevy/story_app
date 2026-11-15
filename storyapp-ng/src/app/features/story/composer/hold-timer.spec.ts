import { createHoldTimer, HOLD_MS } from './hold-timer';

describe('createHoldTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports progress and completes once at the end of the hold', () => {
    const onProgress = vi.fn();
    const onComplete = vi.fn();
    const timer = createHoldTimer({ onProgress, onComplete });

    timer.start();
    vi.advanceTimersByTime(HOLD_MS / 2);
    expect(onComplete).not.toHaveBeenCalled();
    const midway = onProgress.mock.calls.at(-1)![0] as number;
    expect(midway).toBeGreaterThan(0.3);
    expect(midway).toBeLessThan(0.7);

    vi.advanceTimersByTime(HOLD_MS);
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onProgress).toHaveBeenLastCalledWith(1);
    expect(timer.takeCompleted()).toBe(true);
    expect(timer.takeCompleted()).toBe(false);
  });

  it('does not complete when stopped early', () => {
    const onComplete = vi.fn();
    const timer = createHoldTimer({ onComplete });

    timer.start();
    vi.advanceTimersByTime(HOLD_MS / 2);
    timer.stop();
    vi.advanceTimersByTime(HOLD_MS * 2);

    expect(onComplete).not.toHaveBeenCalled();
    expect(timer.takeCompleted()).toBe(false);
  });

  it('keeps the completed flag across stop() until it is taken', () => {
    const timer = createHoldTimer({ durationMs: 100, onComplete: vi.fn() });
    timer.start();
    vi.advanceTimersByTime(200);
    timer.stop();
    expect(timer.takeCompleted()).toBe(true);
  });

  it('restarts from zero', () => {
    const onComplete = vi.fn();
    const timer = createHoldTimer({ durationMs: 100, onComplete });
    timer.start();
    vi.advanceTimersByTime(80);
    timer.start();
    vi.advanceTimersByTime(80);
    expect(onComplete).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40);
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
