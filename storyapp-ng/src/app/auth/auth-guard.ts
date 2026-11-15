import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth';

// AuthService.initialize() runs in provideAppInitializer, which completes before the
// router's initial navigation, so the auth state is already settled when a guard runs.

/** Unauthenticated users go to /login (ProtectedRoute). */
export const authGuard: CanActivateFn = () =>
  inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/login']);

/** Sends logged-in users away from /login and /register. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/']);
