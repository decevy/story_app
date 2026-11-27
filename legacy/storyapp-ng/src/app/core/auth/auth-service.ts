import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  type Observable,
  shareReplay,
  throwError,
} from 'rxjs';

import { injectApiUrl } from '../config/api-url';
import { Logger } from '../logging/logger';
import type { User } from '../models/user';
import {
  type CurrentUserResponse,
  currentUserToUser,
  type LoginRequest,
  type LoginResponse,
  type RefreshTokenRequest,
  type RegisterRequest,
} from './auth-dtos';
import { isTokenExpiring } from './jwt';
import { SKIP_AUTH_REFRESH } from './skip-auth-refresh';
import { TokenStore } from './token-store';

/** The signed-in user, the token lifecycle and the auth endpoints. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly url = injectApiUrl();
  private readonly tokens = inject(TokenStore);
  private readonly router = inject(Router);
  private readonly logger = inject(Logger);

  private readonly userState = signal<User | null>(null);

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  /** One in-flight refresh shared by every caller (interceptor and SignalR). */
  private refreshInFlight$: Observable<string> | null = null;

  /** Validates stored tokens on startup (runs in `provideAppInitializer`). */
  async initialize(): Promise<void> {
    if (!this.tokens.hasTokens()) {
      return;
    }
    try {
      const current = await firstValueFrom(
        this.http.get<CurrentUserResponse>(this.url('/auth/me')),
      );
      this.userState.set(currentUserToUser(current));
    } catch {
      this.clearSession();
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    this.startSession(
      await firstValueFrom(this.http.post<LoginResponse>(this.url('/auth/login'), credentials)),
    );
  }

  async register(data: RegisterRequest): Promise<void> {
    this.startSession(
      await firstValueFrom(this.http.post<LoginResponse>(this.url('/auth/register'), data)),
    );
  }

  /** Ends the session on the server (best effort), locally, and goes to /login. */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.url('/auth/logout'), null));
    } catch (error) {
      this.logger.error('Logout failed:', error);
    } finally {
      this.clearSession();
      await this.router.navigate(['/login']);
    }
  }

  /**
   * Refreshes the token pair. Concurrent callers share one request; on failure the session is
   * cleared and the user is sent to /login, which returns them here after signing in.
   */
  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.tokens.getRefreshToken();
    const request$: Observable<string> = refreshToken
      ? this.http
          .post<LoginResponse>(
            this.url('/auth/refresh'),
            { refreshToken } satisfies RefreshTokenRequest,
            { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) },
          )
          .pipe(
            map(({ accessToken, refreshToken: newRefreshToken }) => {
              this.tokens.setTokens(accessToken, newRefreshToken);
              return accessToken;
            }),
          )
      : throwError(() => new Error('No refresh token available'));

    this.refreshInFlight$ = request$.pipe(
      catchError((refreshError: unknown) => {
        this.logger.error('Token refresh failed:', refreshError);
        this.clearSession();
        const returnUrl = this.router.url;
        void this.router.navigate(['/login'], {
          queryParams: returnUrl.startsWith('/login') ? {} : { returnUrl },
        });
        return throwError(() => refreshError);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight$;
  }

  /** Access token for SignalR; refreshes first when it is expired or about to expire. */
  async getFreshAccessToken(): Promise<string> {
    const accessToken = this.tokens.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }
    if (!isTokenExpiring(accessToken)) {
      return accessToken;
    }
    return firstValueFrom(this.refreshAccessToken());
  }

  private startSession(response: LoginResponse): void {
    this.tokens.setTokens(response.accessToken, response.refreshToken);
    this.userState.set(response.user);
  }

  private clearSession(): void {
    this.tokens.clearTokens();
    this.userState.set(null);
  }
}
