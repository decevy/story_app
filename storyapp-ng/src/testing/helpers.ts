// Test helpers shared by specs. Only spec files may import from src/testing.

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
