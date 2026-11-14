import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from './auth';
import { authGuard, guestGuard } from './auth-guard';

describe('auth guards', () => {
  const initialized = signal(false);
  const authenticated = signal(false);

  beforeEach(() => {
    initialized.set(false);
    authenticated.set(false);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { initialized, isAuthenticated: authenticated },
        },
      ],
    });
  });

  function run(guard: typeof authGuard): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>,
    );
  }

  function serialize(result: boolean | UrlTree | undefined): string | boolean | undefined {
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;
  }

  describe('authGuard', () => {
    it('allows an authenticated user', () => {
      initialized.set(true);
      authenticated.set(true);
      let result: boolean | UrlTree | undefined;
      run(authGuard).subscribe((value) => (result = value));
      TestBed.tick();
      expect(result).toBe(true);
    });

    it('redirects an unauthenticated user to /login', () => {
      initialized.set(true);
      let result: boolean | UrlTree | undefined;
      run(authGuard).subscribe((value) => (result = value));
      TestBed.tick();
      expect(serialize(result)).toBe('/login');
    });

    it('waits for initialization before deciding', () => {
      let result: boolean | UrlTree | undefined;
      run(authGuard).subscribe((value) => (result = value));
      TestBed.tick();
      expect(result).toBeUndefined();

      authenticated.set(true);
      initialized.set(true);
      TestBed.tick();
      expect(result).toBe(true);
    });
  });

  describe('guestGuard', () => {
    it('sends a signed-in user to /', () => {
      initialized.set(true);
      authenticated.set(true);
      let result: boolean | UrlTree | undefined;
      run(guestGuard).subscribe((value) => (result = value));
      TestBed.tick();
      expect(serialize(result)).toBe('/');
    });

    it('lets a guest through', () => {
      initialized.set(true);
      let result: boolean | UrlTree | undefined;
      run(guestGuard).subscribe((value) => (result = value));
      TestBed.tick();
      expect(result).toBe(true);
    });
  });
});
