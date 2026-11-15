import { unsignedJwt } from '../../../testing/helpers';
import { isTokenExpiring, readJwtExpiry } from './jwt';

describe('readJwtExpiry', () => {
  it('reads the exp claim', () => {
    expect(readJwtExpiry(unsignedJwt({ exp: 1_700_000_000 }))).toBe(1_700_000_000);
  });

  it('decodes unpadded base64url payloads with url-safe characters', () => {
    // Three lengths cover every padding case; '~' bytes produce '+' or '/' in plain base64.
    for (const name of ['~~~', '~~~a', '~~~ab']) {
      const token = unsignedJwt({ exp: 42, name });
      expect(token).toMatch(/^header\.[A-Za-z0-9_-]+\.signature$/);
      expect(readJwtExpiry(token)).toBe(42);
    }
  });

  it('returns null without a payload, with invalid JSON or without a numeric exp', () => {
    expect(readJwtExpiry('not-a-jwt')).toBeNull();
    expect(readJwtExpiry('a.%%%.c')).toBeNull();
    expect(readJwtExpiry(unsignedJwt({ sub: '1' }))).toBeNull();
    expect(readJwtExpiry(unsignedJwt({ exp: '123' }))).toBeNull();
  });
});

describe('isTokenExpiring', () => {
  const now = 1_000_000_000_000; // ms

  it('is false when the token expires after the skew window', () => {
    expect(isTokenExpiring(unsignedJwt({ exp: now / 1000 + 60 }), 30, now)).toBe(false);
  });

  it('is true inside the skew window or after expiry', () => {
    expect(isTokenExpiring(unsignedJwt({ exp: now / 1000 + 30 }), 30, now)).toBe(true);
    expect(isTokenExpiring(unsignedJwt({ exp: now / 1000 - 1 }), 30, now)).toBe(true);
  });

  it('treats a token without a readable expiry as expiring', () => {
    expect(isTokenExpiring('garbage', 30, now)).toBe(true);
  });
});
