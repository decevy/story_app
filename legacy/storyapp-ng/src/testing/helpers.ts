// Test helpers shared by specs. Only spec files may import from src/testing.
import { TestBed } from '@angular/core/testing';

/** A promise with its resolve and reject exposed, to control when async work settles. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Runs pending effects, lets already-resolved promises continue (a few microtask turns), then
 * runs effects and change detection again. Replaces `TestBed.tick(); await Promise.resolve(); …`.
 */
export async function settle(turns = 3): Promise<void> {
  TestBed.tick();
  for (let turn = 0; turn < turns; turn++) {
    await Promise.resolve();
  }
  TestBed.tick();
}

/** True when the element has every class in `classes` (Angular does not keep class order). */
export function hasClasses(element: Element, classes: string): boolean {
  return classes.split(' ').every((name) => element.classList.contains(name));
}

/** An unsigned JWT (`header.<claims>.signature`) with base64url-encoded claims. */
export function unsignedJwt(claims: object): string {
  const payload = btoa(JSON.stringify(claims))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${payload}.signature`;
}
