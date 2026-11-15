import { TestBed } from '@angular/core/testing';

import { Clock, CLOCK_TICK_MS } from './clock';

describe('Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T12:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances now on every tick', () => {
    const clock = TestBed.inject(Clock);
    const start = clock.now();

    vi.advanceTimersByTime(CLOCK_TICK_MS);

    expect(clock.now()).toBe(start + CLOCK_TICK_MS);
  });
});
