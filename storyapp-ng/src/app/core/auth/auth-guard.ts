import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth-service';

// AuthService.initialize() runs in provideAppInitializer, which completes before the router's
// initial navigation, so the auth state is already settled when a guard runs.

/** Sends unauthenticated users to /login, remembering where they wanted to go. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(AuthService).isAuthenticated() ||
  inject(Router).createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : {},
  });

/** Sends logged-in users away from /login and /register. */
export const guestGuard: CanActivateFn = () =>
  !inject(AuthService).isAuthenticated() || inject(Router).createUrlTree(['/']);

/**
 * The in-app path to continue to after signing in. Only same-app absolute paths are accepted,
 * so a crafted `returnUrl` cannot send the user to another site.
 */
export function safeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl?.startsWith('/') || returnUrl.startsWith('//') || returnUrl.startsWith('/\\')) {
    return '/';
  }
  return returnUrl;
}
