import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, firstValueFrom, map, shareReplay, throwError } from 'rxjs';

import { APP_CONFIG } from '../core/config/app-config';
import { apiUrl } from '../core/config/api-url';
import { SKIP_AUTH_REFRESH } from '../core/http/http-context';
import {
  CurrentUserResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RegisterRequest,
  User,
} from '../core/models/auth.types';
import { isTokenExpiring } from './jwt';
import { TokenStore } from './token-store';

/** Replaces storyapp-web/src/contexts/AuthContext.tsx. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly tokens = inject(TokenStore);
  private readonly router = inject(Router);

  private readonly userState = signal<User | null>(null);
  private readonly initializedState = signal(false);

  readonly user = this.userState.asReadonly();
  readonly initialized = this.initializedState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);

  /** One in-flight refresh shared by every caller (interceptor and SignalR). */
  private refreshInFlight$: Observable<string> | null = null;

  /** Validates stored tokens on startup (AuthContext initializeAuth). */
  async initialize(): Promise<void> {
    try {
      if (this.tokens.hasTokens()) {
        try {
          const currentUser = await firstValueFrom(
            this.http.get<CurrentUserResponse>(apiUrl(this.config, '/auth/me')),
          );
          this.userState.set({
            id: currentUser.userId,
            username: currentUser.username,
            email: currentUser.email,
            isOnline: true,
            lastSeen: new Date().toISOString(),
          });
        } catch {
          // Token invalid, clear it
          this.tokens.clearTokens();
          this.userState.set(null);
        }
      }
    } finally {
      this.initializedState.set(true);
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(apiUrl(this.config, '/auth/login'), credentials),
      );
      this.tokens.setTokens(response.accessToken, response.refreshToken);
      this.userState.set(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(apiUrl(this.config, '/auth/register'), data),
      );
      this.tokens.setTokens(response.accessToken, response.refreshToken);
      this.userState.set(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(apiUrl(this.config, '/auth/logout'), null));
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear local state even if API call fails
      this.tokens.clearTokens();
      this.userState.set(null);
    }
  }

  /**
   * Refreshes the token pair. Concurrent callers share one request; on failure the
   * session is cleared and the user is sent to /login.
   */
  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const refreshToken = this.tokens.getRefreshToken();
    const request$: Observable<string> = refreshToken
      ? this.http
          .post<LoginResponse>(
            apiUrl(this.config, '/auth/refresh'),
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
        console.error('Token refresh failed:', refreshError);
        this.endSession();
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

  private endSession(): void {
    this.tokens.clearTokens();
    this.userState.set(null);
    void this.router.navigate(['/login']);
  }
}
