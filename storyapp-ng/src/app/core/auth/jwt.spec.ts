import { isTokenExpiring, readJwtExpiry } from './jwt';

/** Builds an unsigned JWT with base64url-encoded claims. */
function jwt(claims: object): string {
  const payload = btoa(JSON.stringify(claims))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `header.${payload}.signature`;
}

describe('readJwtExpiry', () => {
  it('reads the exp claim', () => {
    expect(readJwtExpiry(jwt({ exp: 1_700_000_000 }))).toBe(1_700_000_000);
  });

  it('decodes unpadded base64url payloads with url-safe characters', () => {
    // Three lengths cover every padding case; '~' bytes produce '+' or '/' in plain base64.
    for (const name of ['~~~', '~~~a', '~~~ab']) {
      const token = jwt({ exp: 42, name });
      expect(token).toMatch(/^header\.[A-Za-z0-9_-]+\.signature$/);
      expect(readJwtExpiry(token)).toBe(42);
    }
  });

  it('returns null without a payload, with invalid JSON or without a numeric exp', () => {
    expect(readJwtExpiry('not-a-jwt')).toBeNull();
    expect(readJwtExpiry('a.%%%.c')).toBeNull();
    expect(readJwtExpiry(jwt({ sub: '1' }))).toBeNull();
    expect(readJwtExpiry(jwt({ exp: '123' }))).toBeNull();
  });
});

describe('isTokenExpiring', () => {
  const now = 1_000_000_000_000; // ms

  it('is false when the token expires after the skew window', () => {
    expect(isTokenExpiring(jwt({ exp: now / 1000 + 60 }), 30, now)).toBe(false);
  });

  it('is true inside the skew window or after expiry', () => {
    expect(isTokenExpiring(jwt({ exp: now / 1000 + 30 }), 30, now)).toBe(true);
    expect(isTokenExpiring(jwt({ exp: now / 1000 - 1 }), 30, now)).toBe(true);
  });

  it('treats a token without a readable expiry as expiring', () => {
    expect(isTokenExpiring('garbage', 30, now)).toBe(true);
  });
});
