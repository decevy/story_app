/** Reads the `exp` claim (seconds since epoch) from a JWT without verifying it. */
export function readJwtExpiry(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const claims = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof claims.exp === 'number' ? claims.exp : null;
  } catch {
    return null;
  }
}

/** True when the token has no readable expiry or expires within `skewSeconds`. */
export function isTokenExpiring(token: string, skewSeconds = 30, nowMs = Date.now()): boolean {
  const exp = readJwtExpiry(token);
  if (exp === null) {
    return true;
  }
  return exp * 1000 - nowMs <= skewSeconds * 1000;
}
