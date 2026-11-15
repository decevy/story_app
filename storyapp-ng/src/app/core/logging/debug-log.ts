import { isDevMode } from '@angular/core';

/** console.log that only runs in development builds. Errors keep using console.error. */
export function debugLog(...args: unknown[]): void {
  if (isDevMode()) {
    console.log(...args);
  }
}
