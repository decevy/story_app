import { Injectable } from '@angular/core';

/**
 * localStorage that never throws: reads return `null` and writes are dropped when storage is
 * unavailable (private mode, blocked site data).
 */
@Injectable({ providedIn: 'root' })
export class LocalStorage {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable; the value only lives for this session.
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable; nothing to remove.
    }
  }
}
