import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  MaybeAsync,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { AuthService } from './auth';
import { authGuard, guestGuard } from './auth-guard';

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

  function run(guard: typeof authGuard): string | boolean {
    const result: MaybeAsync<GuardResult> = TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
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
});
