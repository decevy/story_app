import { InjectionToken, isDevMode } from '@angular/core';

/** `isDevMode()` as an injectable value, so specs can switch it per test. */
export const DEV_MODE = new InjectionToken<boolean>('DEV_MODE', {
  providedIn: 'root',
  factory: () => isDevMode(),
});
