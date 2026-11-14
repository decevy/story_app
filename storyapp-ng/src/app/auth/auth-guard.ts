import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';

import { AuthService } from './auth';

/** Waits for auth initialization; unauthenticated users go to /login (ProtectedRoute). */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return toObservable(auth.initialized).pipe(
    filter(Boolean),
    take(1),
    map(() => (auth.isAuthenticated() ? true : router.createUrlTree(['/login']))),
  );
};

/** Sends logged-in users away from /login and /register. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return toObservable(auth.initialized).pipe(
    filter(Boolean),
    take(1),
    map(() => (auth.isAuthenticated() ? router.createUrlTree(['/']) : true)),
  );
};
