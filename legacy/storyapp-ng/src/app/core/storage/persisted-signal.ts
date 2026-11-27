import { effect, inject, signal, type WritableSignal } from '@angular/core';

import { LocalStorage } from './local-storage';

/**
 * A string signal kept in localStorage under `key`. Starts from the stored value when `isValid`
 * accepts it, otherwise from `fallback`. Call it in an injection context.
 */
export function persistedSignal<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
): WritableSignal<T> {
  const storage = inject(LocalStorage);
  const stored = storage.get(key);
  const state = signal<T>(stored !== null && isValid(stored) ? stored : fallback);
  effect(() => {
    storage.set(key, state());
  });
  return state;
}
