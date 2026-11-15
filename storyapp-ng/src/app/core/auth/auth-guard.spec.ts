import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  type GuardResult,
  type MaybeAsync,
  provideRouter,
  Router,
  type RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { authGuard, guestGuard, safeReturnUrl } from './auth-guard';
import { AuthService } from './auth-service';

describe('auth guards', () => {
  const authenticated = signal(false);

  beforeEach(() => {
    authenticated.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: authenticated } },
      ],
    });
  });

  function run(guard: typeof authGuard, url = '/'): string | boolean {
    const result: MaybeAsync<GuardResult> = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    );
    if (result instanceof UrlTree) {
      return TestBed.inject(Router).serializeUrl(result);
    }
    if (typeof result !== 'boolean') {
      throw new Error('Guards are expected to decide synchronously');
    }
    return result;
  }

  describe('authGuard', () => {
    it('allows an authenticated user', () => {
      authenticated.set(true);
      expect(run(authGuard)).toBe(true);
    });

    it('redirects an unauthenticated user to /login', () => {
      expect(run(authGuard)).toBe('/login');
    });

    it('remembers a deep link as returnUrl', () => {
      expect(run(authGuard, '/stories/3')).toBe('/login?returnUrl=%2Fstories%2F3');
    });
  });

  describe('guestGuard', () => {
    it('sends a signed-in user to /', () => {
      authenticated.set(true);
      expect(run(guestGuard)).toBe('/');
    });

    it('lets a guest through', () => {
      expect(run(guestGuard)).toBe(true);
    });
  });

  describe('safeReturnUrl', () => {
    it('keeps in-app paths', () => {
      expect(safeReturnUrl('/stories/3')).toBe('/stories/3');
    });

    it('falls back to / for missing or external targets', () => {
      expect(safeReturnUrl(null)).toBe('/');
      expect(safeReturnUrl('https://evil.test')).toBe('/');
      expect(safeReturnUrl('//evil.test')).toBe('/');
      expect(safeReturnUrl('/\\evil.test')).toBe('/');
    });
  });
});
