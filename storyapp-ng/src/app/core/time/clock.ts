import { DestroyRef, inject, Injectable, signal } from '@angular/core';

/** How often `now` advances. Relative times ("5 minutes ago") only need minute precision. */
export const CLOCK_TICK_MS = 30_000;

/** The current time as a signal, so relative times in templates stay up to date. */
@Injectable({ providedIn: 'root' })
export class Clock {
  private readonly current = signal(Date.now());
  readonly now = this.current.asReadonly();

  constructor() {
    const timer = setInterval(() => {
      this.current.set(Date.now());
    }, CLOCK_TICK_MS);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
    });
  }
}
