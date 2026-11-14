import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../auth/auth';
import { TokenStore } from '../../auth/token-store';
import { APP_CONFIG } from '../config/app-config';
import { isApiUrl } from '../config/api-url';
import { SKIP_AUTH_REFRESH } from './http-context';

function withBearer<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
  return request.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

/**
 * Replaces the request/response interceptors in storyapp-web/src/api/axios-config.ts:
 * adds the bearer token and, on a 401, refreshes once (shared by concurrent requests)
 * and retries. The retry goes to `next`, so it is never intercepted (or retried) again.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(APP_CONFIG);
  if (request.context.get(SKIP_AUTH_REFRESH) || !isApiUrl(config, request.url)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const token = inject(TokenStore).getAccessToken();
  const outgoing = token ? withBearer(request, token) : request;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      // Only a request that carried a token can be fixed by refreshing it.
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !token) {
        return throwError(() => error);
      }
      return auth
        .refreshAccessToken()
        .pipe(switchMap((freshToken) => next(withBearer(request, freshToken))));
    }),
  );
};
