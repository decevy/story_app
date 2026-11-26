import { inject, Injectable } from '@angular/core';

import { DEV_MODE } from '../config/dev-mode';

/** The only place that writes to the console. `debug` is silent in production builds. */
@Injectable({ providedIn: 'root' })
export class Logger {
  private readonly devMode = inject(DEV_MODE);

  debug(...args: unknown[]): void {
    if (this.devMode) {
      console.log(...args);
    }
  }

  warn(message: string, ...details: unknown[]): void {
    console.warn(message, ...details);
  }

  error(message: string, error?: unknown): void {
    if (error === undefined) {
      console.error(message);
    } else {
      console.error(message, error);
    }
  }
}
